package http

import (
	"content-oracle/app/database"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
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
			Name:       sub.Name,
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
