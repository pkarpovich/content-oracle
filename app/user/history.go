package user

import (
	"content-oracle/app/providers"
	"fmt"
	"log"
	"sort"
	"time"
)

type History struct {
	zimaClient *providers.Zima
	baseURL    string
}

func NewHistory(zimaClient *providers.Zima, baseURL string) *History {
	return &History{
		zimaClient: zimaClient,
		baseURL:    baseURL,
	}
}

type Item struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Arist       string `json:"artist"`
	Thumbnail   string `json:"thumbnail"`
	Url         string `json:"url"`
	PublishedAt string `json:"publishedAt"`
	Application string `json:"application"`
}

type PlaybackItem struct {
	ContentID  string    `json:"contentId"`
	StartTime  time.Time `json:"startTime"`
	FinishTime time.Time `json:"finishTime"`
}

type Playback struct {
	ContentID  string    `json:"contentId"`
	StartTime  time.Time `json:"startTime"`
	FinishTime time.Time `json:"finishTime"`
}

type FullHistory struct {
	Items    []Item     `json:"items"`
	Playback []Playback `json:"playback"`
}

func (p *History) GetAll() (*FullHistory, error) {
	fullHistory, err := p.zimaClient.GetContent(true, "")
	if err != nil {
		log.Printf("[ERROR] failed to get youtube history: %s", err)
		return nil, err
	}

	allPlayback := make([]providers.ZimaPlayback, 0)

	for _, item := range fullHistory {
		for _, playback := range item.Playback {
			allPlayback = append(allPlayback, playback)
		}
	}

	sort.Slice(allPlayback, func(i, j int) bool {
		return allPlayback[i].UpdatedAt > allPlayback[j].UpdatedAt
	})

	playback := make([]Playback, 0)
	for index, item := range allPlayback {
		updatedAt, err := time.Parse(time.RFC3339, item.UpdatedAt)
		if err != nil {
			log.Printf("[ERROR] failed to parse updated at time: %s", err)
			continue
		}

		if index == 0 || playback[len(playback)-1].ContentID != item.ContentID {
			playback = append(playback, Playback{
				ContentID:  item.ContentID,
				StartTime:  updatedAt,
				FinishTime: updatedAt,
			})
			continue
		}

		playback[len(playback)-1].StartTime = updatedAt
	}

	var history []Item

	for _, item := range fullHistory {
		historyItem := Item{
			ID:          item.ID,
			Title:       item.Title,
			Arist:       item.Artist,
			Application: item.Application,
		}

		if item.Metadata != nil {
			historyItem.Thumbnail = fmt.Sprintf("%s/api/proxy?url=%s", p.baseURL, item.Metadata.PosterLink)
			historyItem.Url = item.Metadata.ContentUrl
		}

		history = append(history, historyItem)
	}

	return &FullHistory{
		Playback: playback,
		Items:    history,
	}, nil
}
