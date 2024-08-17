package http

import (
	"content-oracle/app/content"
	"content-oracle/app/providers/twitch"
	"content-oracle/app/providers/youtube"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/rs/cors"
	"log"
	"net/http"
	"regexp"
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
	mux.HandleFunc("POST /api/content/open", c.openContentHandler)
	mux.HandleFunc("GET /api/settings", c.getSettings)
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

func (c *Client) getAllContentHandler(w http.ResponseWriter, r *http.Request) {
	contentList, err := c.ContentService.GetAll()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	youtubeHistory, err := c.ContentService.GetYoutubeHistory()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	contentList = append(contentList, youtubeHistory...)

	err = json.NewEncoder(w).Encode(contentList)
	if err != nil {
		log.Printf("[ERROR] failed to encode content response: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

type YoutubeSubscription struct {
	ChannelId string `json:"channelId"`
	Name      string `json:"name"`
	Rank      int    `json:"rank"`
	URL       string `json:"url"`
}

type SettingsResponse struct {
	Subscriptions []YoutubeSubscription `json:"subscriptions"`
}

func (c *Client) getSettings(w http.ResponseWriter, r *http.Request) {
	subscriptions, err := c.YouTubeService.GetUserSubscriptions()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var subscriptionsResponse []YoutubeSubscription
	for _, sub := range subscriptions {
		subscriptionsResponse = append(subscriptionsResponse, YoutubeSubscription{
			URL:       fmt.Sprintf("https://www.youtube.com/channel/%s", sub.Snippet.ResourceId.ChannelId),
			ChannelId: sub.Snippet.ResourceId.ChannelId,
			Name:      sub.Snippet.Title,
			Rank:      0,
		})
	}

	if err = json.NewEncoder(w).Encode(SettingsResponse{Subscriptions: subscriptionsResponse}); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
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

func (c *Client) fileHandler(w http.ResponseWriter, r *http.Request) {
	fileMatcher := regexp.MustCompile(`^/.*\..+$`)
	if fileMatcher.MatchString(r.URL.Path) {
		http.ServeFile(w, r, fmt.Sprintf("%s/%s", c.BaseStaticPath, r.URL.Path[1:]))
		return
	}

	http.ServeFile(w, r, fmt.Sprintf("%s/%s", c.BaseStaticPath, "index.html"))
}
