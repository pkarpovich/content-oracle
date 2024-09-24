package http

import (
	"encoding/json"
	"log"
	"net/http"
)

type CreateActivityRequest struct {
	ChannelID string `json:"channelId"`
	VideoID   string `json:"videoId"`
	Status    string `json:"status"`
}

type CreateActivityResponse struct {
	ID        int    `json:"id"`
	ChannelID string `json:"channelId"`
	VideoID   string `json:"videoId"`
	Status    string `json:"status"`
}

func (c *Server) createActivityHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateActivityRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.ChannelID == "" && req.VideoID != "" {
		blockedVideo, err := c.UserActivity.BlockVideo(req.VideoID, req.Status)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		err = json.NewEncoder(w).Encode(CreateActivityResponse{
			ID:      blockedVideo.ID,
			VideoID: blockedVideo.VideoID,
			Status:  blockedVideo.Status,
		})
		if err != nil {
			log.Printf("[ERROR] failed to encode activity response: %s", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		return
	}

	if req.ChannelID != "" && req.VideoID == "" {
		blockedChannel, err := c.UserActivity.BlockChannel(req.ChannelID, req.Status)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		err = json.NewEncoder(w).Encode(CreateActivityResponse{
			ID:        blockedChannel.ID,
			ChannelID: blockedChannel.ChannelID,
			Status:    blockedChannel.Status,
		})
		if err != nil {
			log.Printf("[ERROR] failed to encode activity response: %s", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		return
	}

	http.Error(w, "invalid request", http.StatusBadRequest)
}
