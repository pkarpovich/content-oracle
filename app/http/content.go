package http

import (
	"content-oracle/app/content"
	"content-oracle/app/providers/esport"
	"encoding/json"
	"log"
	"net/http"
)

type GetAllContentResponse struct {
	ContentList    []content.Content `json:"contentList"`
	EsportsMatches []esport.Match    `json:"esportsMatches"`
}

func (c *Server) getAllContentHandler(w http.ResponseWriter, r *http.Request) {
	contentList, err := c.ContentMultiProvider.GetAll()
	if err != nil {
		log.Printf("[ERROR] failed to get all content: %s", err)
	}

	eSportMatches, err := c.ESportMultiProvider.GetAll()
	if err != nil {
		log.Printf("[ERROR] failed to get all esports matches: %s", err)
	}

	err = json.NewEncoder(w).Encode(GetAllContentResponse{
		ContentList:    contentList,
		EsportsMatches: eSportMatches,
	})
	if err != nil {
		log.Printf("[ERROR] failed to encode content response: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

type OpenContentRequest struct {
	Url string `json:"url"`
}

func (c *Server) openContentHandler(w http.ResponseWriter, r *http.Request) {
	var req OpenContentRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err = c.ZimaClient.OpenUrl(req.Url); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
