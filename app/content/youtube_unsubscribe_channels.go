package content

import (
	"content-oracle/app/database"
	"time"
)

type YouTubeUnsubscribeChannels struct {
	youtubeRepository *database.YouTubeRepository
}

type YouTubeUnsubscribeChannelsOptions struct {
	YoutubeRepository *database.YouTubeRepository
}

func NewYouTubeUnsubscribeChannels(opt YouTubeUnsubscribeChannelsOptions) *YouTubeUnsubscribeChannels {
	return &YouTubeUnsubscribeChannels{
		youtubeRepository: opt.YoutubeRepository,
	}
}

func (y *YouTubeUnsubscribeChannels) GetAll(ignoredVideoIDs []string) ([]Content, error) {
	content := make([]Content, 0)

	publishedAfter := time.Now().AddDate(0, 0, -7)
	videos, err := y.youtubeRepository.GetLastVideosFromUnsubscribedChannels(publishedAfter, ignoredVideoIDs)
	if err != nil {
		return nil, err
	}

	for _, video := range videos {
		content = append(content, YoutubeVideoToContent(video, "Unsubscribed Channels"))
	}

	return content, nil
}
