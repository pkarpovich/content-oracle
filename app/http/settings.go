package http

import (
	"content-oracle/app/database"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
)

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

func (c *Server) getSettingsHandler(w http.ResponseWriter, r *http.Request) {
	subscriptions, err := c.YouTubeRepository.GetAllSubscribedChannels()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ranking, err := c.YouTubeRepository.GetAllRanking()
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
			ChannelId:  sub.ID,
			Name:       sub.Title,
			PreviewURL: sub.PreviewURL,
			Rank:       rankingMap[sub.ID],
			URL:        fmt.Sprintf("https://www.youtube.com/channel/%s", sub.ID),
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

func (c *Server) saveSettingsHandler(w http.ResponseWriter, r *http.Request) {
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

	if err = c.YouTubeRepository.BatchUpdateRanking(rankings); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (c *Server) cleanSettingsHandler(w http.ResponseWriter, r *http.Request) {
	if err := c.YouTubeService.CleanAuth(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (c *Server) initChannelsHandler(w http.ResponseWriter, r *http.Request) {
	service, err := c.YouTubeService.GetService(context.Background())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userSubscriptions, err := c.YouTubeService.GetUserSubscriptions(service)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, sub := range userSubscriptions {
		channelID := sub.Snippet.ResourceId.ChannelId
		channel, err := c.YouTubeRepository.GetChannelByID(channelID)
		if err != nil {
			log.Printf("[ERROR] failed to get channel by title: %s", err)
			continue
		}

		if channel != nil {
			continue
		}

		title := strings.TrimSpace(sub.Snippet.Title)
		channel, err = c.YouTubeRepository.CreateChannel(&database.YouTubeChannel{
			ID:           channelID,
			Title:        title,
			PreviewURL:   sub.Snippet.Thumbnails.Medium.Url,
			IsSubscribed: true,
		})
		if err != nil {
			log.Printf("[ERROR] Error creating channel: %s %s", sub.Snippet.Title, err)
			continue
		}
	}
}
