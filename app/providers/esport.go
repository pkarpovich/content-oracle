package providers

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"time"
)

type ESport struct {
	BaseURL string
	ApiKey  string
	TeamIds []string
}

type ESportOptions struct {
	BaseURL string
	ApiKey  string
	TeamIds []string
}

func NewEsport(opt *ESportOptions) *ESport {
	return &ESport{
		BaseURL: opt.BaseURL,
		ApiKey:  opt.ApiKey,
		TeamIds: opt.TeamIds,
	}
}

type ESportTeam struct {
	Id      int    `json:"id"`
	Acronym string `json:"acronym"`
	Name    string `json:"name"`
	Logo    string `json:"logo"`
}

type ESportMatch struct {
	Id         string     `json:"id"`
	Tournament string     `json:"tournament"`
	Team1      ESportTeam `json:"team1"`
	Team2      ESportTeam `json:"team2"`
	Score      string     `json:"score"`
	Time       time.Time  `json:"time"`
	BestOf     int        `json:"bestOf"`
	Location   string     `json:"location"`
	URL        string     `json:"url"`
	IsLive     bool       `json:"isLive"`
	GameType   string     `json:"gameType"`
	ModifiedAt time.Time  `json:"modifiedAt"`
}

type getMatchesRequest struct {
	Ids   []string  `json:"ids"`
	After time.Time `json:"after"`
}

type getMatchesResponse struct {
	Data []ESportMatch `json:"data"`
}

func (c *ESport) GetMatches() ([]ESportMatch, error) {
	after := time.Now().Add(-time.Hour * 24 * 15)
	bodyBytes, err := json.Marshal(getMatchesRequest{Ids: c.TeamIds, After: after})
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

	var response getMatchesResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}

	sortMatches(response.Data)

	return response.Data, nil
}

func sortMatches(matches []ESportMatch) {
	today := time.Now().Truncate(24 * time.Hour)

	sort.Slice(matches, func(i, j int) bool {
		matchTimeI := matches[i].Time.Truncate(24 * time.Hour)
		matchTimeJ := matches[j].Time.Truncate(24 * time.Hour)

		if matchTimeI.Equal(today) && !matchTimeJ.Equal(today) {
			return true
		}
		if !matchTimeI.Equal(today) && matchTimeJ.Equal(today) {
			return false
		}

		if matchTimeI.After(today) && matchTimeJ.Before(today) {
			return true
		}
		if matchTimeI.Before(today) && matchTimeJ.After(today) {
			return false
		}

		if matchTimeI.After(today) && matchTimeJ.After(today) {
			return matches[i].Time.Before(matches[j].Time)
		}

		return matches[i].Time.After(matches[j].Time)
	})
}
