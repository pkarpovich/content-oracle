package http

import (
	"content-oracle/app/content"
	"content-oracle/app/database"
	"content-oracle/app/providers/esport"
	"content-oracle/app/providers/twitch"
	"content-oracle/app/providers/youtube"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/rs/cors"
	"io"
	"log"
	"net/http"
	"regexp"
	"sort"
	"time"
)

type Client struct {
	TwitchClient   *twitch.Client
	ContentService *content.Client
	YouTubeService *youtube.Client
	BaseStaticPath string
	Port           int
}

type ClientOptions struct {
	ContentService *content.Client
	TwitchClient   *twitch.Client
	YouTubeService *youtube.Client
	BaseStaticPath string
	Port           int
}

func NewClient(opt *ClientOptions) *Client {
	return &Client{
		BaseStaticPath: opt.BaseStaticPath,
		ContentService: opt.ContentService,
		YouTubeService: opt.YouTubeService,
		TwitchClient:   opt.TwitchClient,
		Port:           opt.Port,
	}
}

func (c *Client) Start(ctx context.Context, done chan struct{}) {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", c.healthHandler)
	mux.HandleFunc("GET /auth/twitch/callback", c.twitchAuthCallbackHandler)
	mux.HandleFunc("GET /auth/youtube/callback", c.youtubeAuthCallbackHandler)
	mux.HandleFunc("GET /api/content", c.getAllContentHandler)
	mux.HandleFunc("GET /api/content/suggestions", c.getYoutubeSuggestionsHandler)
	mux.HandleFunc("POST /api/content/open", c.openContentHandler)
	mux.HandleFunc("POST /api/activity", c.createActivityHandler)
	mux.HandleFunc("GET /api/settings", c.getSettingsHandler)
	mux.HandleFunc("POST /api/settings", c.saveSettingsHandler)
	mux.HandleFunc("DELETE /api/settings", c.cleanSettingsHandler)
	mux.HandleFunc("GET /api/history", c.getHistoryHandler)
	mux.HandleFunc("GET /api/proxy", c.proxyHandler)
	mux.HandleFunc("GET /", c.fileHandler)

	server := &http.Server{
		Addr: fmt.Sprintf(":%d", c.Port),
		Handler: cors.New(cors.Options{
			AllowedOrigins: []string{"*"},
			AllowedMethods: []string{"GET", "POST", "PATCH", "DELETE"},
		}).Handler(mux),
	}

	go func() {
		log.Printf("[INFO] Starting HTTP server on %s", server.Addr)
		if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
			log.Printf("[ERROR] HTTP server error: %v", err)
		}
		log.Printf("[INFO] HTTP server stopped")
	}()

	<-ctx.Done()

	shutdownCtx, shutdownRelease := context.WithTimeout(ctx, 10*time.Second)
	defer shutdownRelease()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("[ERROR] HTTP server error: %v", err)
	}
	log.Printf("[INFO] HTTP server shutdown")

	close(done)
}

type HealthResponse struct {
	Message string `json:"message"`
}

func (c *Client) healthHandler(w http.ResponseWriter, r *http.Request) {
	err := json.NewEncoder(w).Encode(HealthResponse{
		Message: "OK",
	})
	if err != nil {
		log.Printf("[ERROR] failed to encode health response: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *Client) twitchAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "code not found", http.StatusBadRequest)
		return
	}

	if err := c.TwitchClient.SetAuthToken(code); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	err := json.NewEncoder(w).Encode(struct {
		Status string `json:"status"`
	}{
		Status: "ok",
	})
	if err != nil {
		log.Printf("[ERROR] failed to encode auth response: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *Client) youtubeAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "code not found", http.StatusBadRequest)
		return
	}

	if err := c.YouTubeService.HandleAuthCode(code); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	err := json.NewEncoder(w).Encode(struct {
		Status string `json:"status"`
	}{
		Status: "ok",
	})
	if err != nil {
		log.Printf("[ERROR] failed to encode auth response: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

type GetAllContentResponse struct {
	ContentList    []content.Content `json:"contentList"`
	EsportsMatches []esport.Match    `json:"esportsMatches"`
}

func (c *Client) getAllContentHandler(w http.ResponseWriter, r *http.Request) {
	contentList, err := c.ContentService.GetAll()
	if err != nil {
		log.Printf("[ERROR] failed to get all content: %s", err)
	}

	youtubeHistory, err := c.ContentService.GetYoutubeHistory()
	if err != nil {
		log.Printf("[ERROR] failed to get youtube history: %s", err)
	}
	contentList = append(contentList, youtubeHistory...)

	youtubeSuggestions, err := c.ContentService.GetYoutubeSuggestions()
	if err != nil {
		log.Printf("[ERROR] failed to get youtube suggestions: %s", err)
	}
	contentList = append(contentList, youtubeSuggestions...)

	unsubscribedVideos, err := c.ContentService.GetVideoFromUnsubscribeChannels()
	if err != nil {
		log.Printf("[ERROR] failed to get unsubscribed videos: %s", err)
	}
	contentList = append(contentList, unsubscribedVideos...)

	esportsMatches, err := c.ContentService.GetUpcomingEsportEvents()

	err = json.NewEncoder(w).Encode(GetAllContentResponse{
		ContentList:    contentList,
		EsportsMatches: esportsMatches,
	})
	if err != nil {
		log.Printf("[ERROR] failed to encode content response: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *Client) getYoutubeSuggestionsHandler(w http.ResponseWriter, r *http.Request) {
	contentList, err := c.ContentService.GetYoutubeSuggestions()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(contentList)
	if err != nil {
		log.Printf("[ERROR] failed to encode content response: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

type YoutubeSubscription struct {
	ChannelId  string `json:"channelId"`
	Name       string `json:"name"`
	Rank       int    `json:"rank"`
	URL        string `json:"url"`
	PreviewURL string `json:"previewUrl"`
}

type SettingsResponse struct {
	Subscriptions []YoutubeSubscription     `json:"subscriptions"`
	Ranking       []database.YouTubeRanking `json:"ranking"`
}

func (c *Client) getSettingsHandler(w http.ResponseWriter, r *http.Request) {
	youtubeService, err := c.YouTubeService.GetService(context.Background())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	subscriptions, err := c.YouTubeService.GetUserSubscriptions(youtubeService)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ranking, err := c.YouTubeService.GetRanking()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rankingMap := make(map[string]int)
	for _, rank := range ranking {
		rankingMap[rank.ID] = rank.Rank
	}

	var subscriptionsResponse []YoutubeSubscription
	for _, sub := range subscriptions {
		subscriptionsResponse = append(subscriptionsResponse, YoutubeSubscription{
			URL:        fmt.Sprintf("https://www.youtube.com/channel/%s", sub.Snippet.ResourceId.ChannelId),
			PreviewURL: sub.Snippet.Thumbnails.Default.Url,
			ChannelId:  sub.Snippet.ResourceId.ChannelId,
			Name:       sub.Snippet.Title,
			Rank:       rankingMap[sub.Snippet.ResourceId.ChannelId],
		})
	}

	sort.Slice(subscriptionsResponse, func(i, j int) bool {
		return subscriptionsResponse[i].Rank > subscriptionsResponse[j].Rank
	})

	resp := &SettingsResponse{
		Subscriptions: subscriptionsResponse,
		Ranking:       ranking,
	}

	if err = json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *Client) saveSettingsHandler(w http.ResponseWriter, r *http.Request) {
	var req SettingsResponse
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var rankings []database.YouTubeRanking
	for _, rank := range req.Ranking {
		rankings = append(rankings, database.YouTubeRanking{
			ID:   rank.ID,
			Rank: rank.Rank,
		})
	}

	if err = c.YouTubeService.UpdateRanking(rankings); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (c *Client) cleanSettingsHandler(w http.ResponseWriter, r *http.Request) {
	if err := c.YouTubeService.CleanAuth(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

type OpenContentRequest struct {
	Url string `json:"url"`
}

func (c *Client) openContentHandler(w http.ResponseWriter, r *http.Request) {
	var req OpenContentRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err = c.ContentService.OpenContentUrl(req.Url); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

type CreateActivityRequest struct {
	ContentID string `json:"contentId"`
	Status    string `json:"status"`
}

type CreateActivityResponse struct {
	ID        int    `json:"id"`
	ContentID string `json:"contentId"`
	Status    string `json:"status"`
}

func (c *Client) createActivityHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateActivityRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	activity, err := c.ContentService.CreateActivity(req.ContentID, req.Status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(CreateActivityResponse{
		ID:        activity.ID,
		ContentID: activity.ContentID,
		Status:    activity.Status,
	})
	if err != nil {
		log.Printf("[ERROR] failed to encode activity response: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *Client) getHistoryHandler(w http.ResponseWriter, r *http.Request) {
	historyList, err := c.ContentService.GetFullHistory()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(historyList)
	if err != nil {
		log.Printf("[ERROR] failed to encode content response: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *Client) proxyHandler(w http.ResponseWriter, r *http.Request) {
	imageUrl := r.URL.Query().Get("url")
	if imageUrl == "" {
		http.Error(w, "url not found", http.StatusBadRequest)
		return
	}

	resp, err := http.Get(imageUrl)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("[ERROR] failed to close response body: %s", err)
		}
	}()

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		log.Printf("[ERROR] failed to copy response body: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *Client) fileHandler(w http.ResponseWriter, r *http.Request) {
	fileMatcher := regexp.MustCompile(`^/.*\..+$`)
	if fileMatcher.MatchString(r.URL.Path) {
		http.ServeFile(w, r, fmt.Sprintf("%s/%s", c.BaseStaticPath, r.URL.Path[1:]))
		return
	}

	http.ServeFile(w, r, fmt.Sprintf("%s/%s", c.BaseStaticPath, "index.html"))
}
