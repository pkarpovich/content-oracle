package http

import (
	"encoding/json"
	"log"
	"net/http"
)

func (c *Server) getHistoryHandler(w http.ResponseWriter, r *http.Request) {
	historyList, err := c.UserHistory.GetAll()
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
