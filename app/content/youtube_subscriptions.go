package content

import (
	"content-oracle/app/database"
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
		content = append(content, YoutubeVideoToContent(video, "YouTube Suggestions"))
	}

	return content, nil
}
