package http

import (
	"encoding/json"
	"net/http"
	"net/url"
)

type AddWatchlistItemRequest struct {
	YoutubeURL string `json:"youtubeUrl"`
}

type AddWatchlistItemResponse struct {
	ID      int    `json:"id"`
	VideoID string `json:"videoId"`
}

func (c *Server) addWatchlistItemHandler(w http.ResponseWriter, r *http.Request) {
	var req AddWatchlistItemRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	u, err := url.Parse(req.YoutubeURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	videoID := u.Query().Get("v")
	if videoID == "" {
		http.Error(w, "video id not found", http.StatusBadRequest)
		return
	}

	watchlist, err := c.UserWatchlist.Add(videoID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	resp := AddWatchlistItemResponse{
		ID:      watchlist.ID,
		VideoID: watchlist.VideoID,
	}
	if err = json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
