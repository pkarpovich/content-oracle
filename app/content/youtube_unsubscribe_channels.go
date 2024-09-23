package content

import (
	"content-oracle/app/database"
	"content-oracle/app/providers/zima"
	"fmt"
	"github.com/samber/lo"
	"log"
	"sort"
	"time"
)

type YouTubeUnsubscribeChannels struct {
	activityRepository *database.ActivityRepository
	youtubeRepository  *database.YouTubeRepository
	zimaClient         *zima.Client
}

type YouTubeUnsubscribeChannelsOptions struct {
	ActivityRepository *database.ActivityRepository
	YoutubeRepository  *database.YouTubeRepository
	ZimaClient         *zima.Client
}

func NewYouTubeUnsubscribeChannels(opt YouTubeUnsubscribeChannelsOptions) *YouTubeUnsubscribeChannels {
	return &YouTubeUnsubscribeChannels{
		activityRepository: opt.ActivityRepository,
		youtubeRepository:  opt.YoutubeRepository,
		zimaClient:         opt.ZimaClient,
	}
}

func (y *YouTubeUnsubscribeChannels) GetAll() ([]Content, error) {
	videoActivity, err := y.activityRepository.GetAll()
	if err != nil {
		log.Printf("[ERROR] failed to get video activity: %s", err)
		return nil, err
	}

	history, err := y.zimaClient.GetContent(false, YoutubeApplicationName)
	if err != nil {
		log.Printf("[ERROR] failed to get youtube history: %s", err)
		return nil, err
	}

	content := make([]Content, 0)

	unsubscribedChannels, err := y.youtubeRepository.GetAllUnsubscribedChannels()
	if err != nil {
		log.Printf("[ERROR] failed to get unsubscribed channels: %s", err)
		return nil, err
	}

	unsubscribedChannels = lo.Filter(unsubscribedChannels, func(channel database.YouTubeChannel, _ int) bool {
		return lo.ContainsBy(videoActivity, func(activity database.Activity) bool {
			return activity.ContentID == channel.ID
		})
	})

	for _, channel := range unsubscribedChannels {
		if len(content) >= MaxSuggestions {
			break
		}

		videos, err := y.youtubeRepository.GetChannelVideos(channel.ID, time.Now().AddDate(0, 0, -7))
		if err != nil {
			log.Printf("[ERROR] failed to get channel videos: %s", err)
			continue
		}

		videos = lo.Filter(videos, func(video database.YouTubeVideo, _ int) bool {
			return !lo.ContainsBy(history, func(item zima.Content) bool {
				return item.Metadata != nil && item.Metadata.VideoID == video.ID
			})
		})

		videos = lo.Filter(videos, func(video database.YouTubeVideo, _ int) bool {
			return !lo.ContainsBy(videoActivity, func(activity database.Activity) bool {
				return activity.ContentID == video.ID
			})
		})

		for _, video := range videos {
			content = append(content, Content{
				ID:          video.ID,
				Artist:      Artist{},
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
