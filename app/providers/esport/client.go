package esport

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"time"
)

type Client struct {
	BaseURL string
	ApiKey  string
	TeamIds []string
}

type ClientOptions struct {
	BaseURL string
	ApiKey  string
	TeamIds []string
}

func NewClient(opt *ClientOptions) *Client {
	return &Client{
		BaseURL: opt.BaseURL,
		ApiKey:  opt.ApiKey,
		TeamIds: opt.TeamIds,
	}
}

type Team struct {
	Id      int    `json:"id"`
	Acronym string `json:"acronym"`
	Name    string `json:"name"`
	Logo    string `json:"logo"`
}

type Match struct {
	Id         string    `json:"id"`
	Tournament string    `json:"tournament"`
	Team1      Team      `json:"team1"`
	Team2      Team      `json:"team2"`
	Score      string    `json:"score"`
	Time       time.Time `json:"time"`
	BestOf     int       `json:"bestOf"`
	Location   string    `json:"location"`
	URL        string    `json:"url"`
	IsLive     bool      `json:"isLive"`
	GameType   string    `json:"gameType"`
	ModifiedAt time.Time `json:"modifiedAt"`
}

type GetMatchesRequest struct {
	Ids []string `json:"ids"`
}

type GetMatchesResponse struct {
	Data []Match `json:"data"`
}

func (c *Client) GetMatches() ([]Match, error) {
	bodyBytes, err := json.Marshal(GetMatchesRequest{Ids: c.TeamIds})
	if err != nil {
		return nil, err
	}

	reader := bytes.NewReader(bodyBytes)
	resp, err := http.Post(c.BaseURL+"/events", "application/json", reader)
	if err != nil {
		return nil, err
	}

	defer func() {
		err := resp.Body.Close()
		if err != nil {
			log.Printf("error while closing response body: %v", err)
		}
	}()

	var response GetMatchesResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}

	sort.Slice(response.Data, func(i, j int) bool {
		return response.Data[i].Time.After(response.Data[j].Time)
	})

	return response.Data, nil
}
