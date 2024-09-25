package content

import (
	"content-oracle/app/database"
	"fmt"
	"log"
	"sort"
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

	unsubscribedChannels, err := y.youtubeRepository.GetAllUnsubscribedChannels()
	if err != nil {
		log.Printf("[ERROR] failed to get unsubscribed channels: %s", err)
		return nil, err
	}

	for _, channel := range unsubscribedChannels {
		if len(content) >= MaxSuggestions {
			break
		}

		videos, err := y.youtubeRepository.GetChannelVideos(channel.ID, time.Now().AddDate(0, 0, -7), ignoredVideoIDs)
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
				Category:    "Unsubscribed Channels",
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
