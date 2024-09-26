package content

import (
	"content-oracle/app/database"
	"fmt"
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
	var content []Content

	publishedAfter := time.Now().AddDate(0, 0, -7)
	videos, err := y.youtubeRepository.GetTopRankedChannelVideos(publishedAfter, ignoredVideoIDs)
	if err != nil {
		return nil, err
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

	return content, nil
}
