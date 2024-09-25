package content

import (
	"content-oracle/app/database"
	"fmt"
	"log"
	"sort"
	"time"
)

type YouTubeSubscription struct {
	youtubeRepository *database.YouTubeRepository
}

type YouTubeSubscriptionOptions struct {
	YoutubeRepository *database.YouTubeRepository
}

func NewYouTubeSubscription(opt YouTubeSubscriptionOptions) *YouTubeSubscription {
	return &YouTubeSubscription{
		youtubeRepository: opt.YoutubeRepository,
	}
}

func (y *YouTubeSubscription) GetAll(ignoredVideoIDs []string) ([]Content, error) {
	ranking, err := y.youtubeRepository.GetAllRanking()
	if err != nil {
		log.Printf("[ERROR] failed to get youtube ranking: %s", err)
		return nil, err
	}

	var content []Content

	for _, rank := range ranking {
		if len(content) >= MaxSuggestions {
			break
		}

		videos, err := y.youtubeRepository.GetChannelVideos(rank.ID, time.Now().AddDate(0, 0, -7), ignoredVideoIDs)
		if err != nil {
			log.Printf("[ERROR] failed to get channel videos: %s", err)
			continue
		}

		for _, video := range videos {
			content = append(content, Content{
				ID: video.ID,
				Artist: Artist{
					Name: video.Channel.Title,
					ID:   video.Channel.ID,
				},
				Title:       video.Title,
				Thumbnail:   video.Thumbnail,
				Url:         fmt.Sprintf("https://www.youtube.com/watch?v=%s", video.ID),
				Category:    "YouTube Suggestions",
				PublishedAt: video.PublishedAt.Local().String(),
				IsLive:      false,
				Position:    0,
			})
		}
	}

	sort.Slice(content, func(i, j int) bool {
		return content[i].PublishedAt > content[j].PublishedAt
	})

	return content, nil
}
