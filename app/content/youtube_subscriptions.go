package content

import (
	"content-oracle/app/database"
	"content-oracle/app/providers/zima"
	"fmt"
	"github.com/samber/lo"
	"log"
	"slices"
	"sort"
	"time"
)

type YouTubeSubscription struct {
	activityRepository *database.ActivityRepository
	youtubeRepository  *database.YouTubeRepository
	zimaClient         *zima.Client
}

type YouTubeSubscriptionOptions struct {
	ActivityRepository *database.ActivityRepository
	YoutubeRepository  *database.YouTubeRepository
	ZimaClient         *zima.Client
}

func NewYouTubeSubscription(opt YouTubeSubscriptionOptions) *YouTubeSubscription {
	return &YouTubeSubscription{
		activityRepository: opt.ActivityRepository,
		youtubeRepository:  opt.YoutubeRepository,
		zimaClient:         opt.ZimaClient,
	}
}

func (y *YouTubeSubscription) GetAll() ([]Content, error) {
	history, err := y.zimaClient.GetContent(false, YoutubeApplicationName)
	if err != nil {
		log.Printf("[ERROR] failed to get youtube history: %s", err)
		return nil, err
	}

	videoActivity, err := y.activityRepository.GetAll()
	if err != nil {
		log.Printf("[ERROR] failed to get video activity: %s", err)
		return nil, err
	}

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

		videos, err := y.youtubeRepository.GetChannelVideos(rank.ID, time.Now().AddDate(0, 0, -7))
		if err != nil {
			log.Printf("[ERROR] failed to get channel videos: %s", err)
			continue
		}

		videos = lo.Filter(videos, func(video database.YouTubeVideo, _ int) bool {
			return !slices.ContainsFunc(history, func(item zima.Content) bool {
				return item.Metadata != nil && item.Metadata.VideoID == video.ID
			})
		})

		videos = lo.Filter(videos, func(video database.YouTubeVideo, _ int) bool {
			return !slices.ContainsFunc(videoActivity, func(activity database.Activity) bool {
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
				Category:    "YouTube Suggestions",
				PublishedAt: video.PublishedAt,
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
