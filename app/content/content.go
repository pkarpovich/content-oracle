package content

import (
	"content-oracle/app/database"
	"content-oracle/app/providers/esport"
	"content-oracle/app/providers/zima"
	"context"
	"fmt"
	"github.com/go-pkgz/syncs"
	"github.com/samber/lo"
	"log"
)

const MaxSuggestions = 20
const RemainingTimeThreshold = 300

type Artist struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Content struct {
	ID          string  `json:"id"`
	Artist      Artist  `json:"artist"`
	Title       string  `json:"title"`
	Thumbnail   string  `json:"thumbnail"`
	Url         string  `json:"url"`
	IsLive      bool    `json:"isLive"`
	Position    float64 `json:"position"`
	Remaining   int     `json:"_"`
	Category    string  `json:"category"`
	PublishedAt string  `json:"publishedAt"`
}

type Provider interface {
	GetAll(ignoredVideoIDs []string) ([]Content, error)
}

type MultiProvider struct {
	youtubeHistoryProvider *YouTubeHistory
	providers              []Provider
}

func NewMultiProvider(zimaClient *zima.Client, blockedVideoRepository *database.BlockedVideoRepository, providers ...Provider) MultiProvider {
	youtubeHistoryProvider := NewYouTubeHistory(YouTubeHistoryOptions{
		BlockedVideoRepository: blockedVideoRepository,
		ZimaClient:             zimaClient,
	})

	return MultiProvider{
		youtubeHistoryProvider: youtubeHistoryProvider,
		providers:              providers,
	}
}

func (mp MultiProvider) GetAll() ([]Content, error) {
	allContent := make([]Content, 0)
	historyContent, err := mp.youtubeHistoryProvider.GetAll()
	if err != nil {
		log.Printf("[ERROR] failed to get content from youtube history: %s", err)
		return nil, err
	}

	ignoredVideoIDs := lo.Map(historyContent, func(item Content, _ int) string {
		return item.ID
	})

	historyContent = lo.Filter(historyContent, func(item Content, _ int) bool {
		return item.Remaining > RemainingTimeThreshold
	})

	allContent = append(allContent, historyContent...)
	wg := syncs.NewSizedGroup(4)

	for _, provider := range mp.providers {
		wg.Go(func(ctx context.Context) {
			content, err := provider.GetAll(ignoredVideoIDs)
			if err != nil {
				log.Printf("[ERROR] failed to get content from provider: %s", err)
				return
			}

			allContent = append(allContent, content...)
		})
	}

	wg.Wait()

	return allContent, nil
}

type ESportProvider interface {
	GetAll() ([]esport.Match, error)
}

type MultiESportProvider []ESportProvider

func (mp MultiESportProvider) GetAll() ([]esport.Match, error) {
	wg := syncs.NewSizedGroup(4)

	var allMatches []esport.Match

	for _, provider := range mp {
		wg.Go(func(ctx context.Context) {
			matches, err := provider.GetAll()
			if err != nil {
				log.Printf("[ERROR] failed to get matches from provider: %s", err)
				return
			}

			allMatches = append(allMatches, matches...)
		})
	}

	wg.Wait()

	return allMatches, nil
}

func YoutubeVideoToContent(v database.YouTubeVideo, category string) Content {
	return Content{
		ID: v.ID,
		Artist: Artist{
			Name: v.Channel.Title,
			ID:   v.Channel.ID,
		},
		Title:       v.Title,
		Thumbnail:   v.Thumbnail,
		Url:         fmt.Sprintf("https://www.youtube.com/watch?v=%s", v.ID),
		Category:    category,
		PublishedAt: v.PublishedAt.Local().String(),
		IsLive:      false,
		Position:    0,
	}
}
