package http

import (
	"encoding/json"
	"log"
	"net/http"
)

type CreateActivityRequest struct {
	ContentID string `json:"contentId"`
	Status    string `json:"status"`
}

type CreateActivityResponse struct {
	ID        int    `json:"id"`
	ContentID string `json:"contentId"`
	Status    string `json:"status"`
}

func (c *Server) createActivityHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateActivityRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	activity, err := c.UserActivity.Create(req.ContentID, req.Status)
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
