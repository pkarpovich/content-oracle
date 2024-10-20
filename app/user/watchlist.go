package user

import (
	"content-oracle/app/database"
	"content-oracle/app/providers"
	"context"
	"fmt"
	"log"
	"time"
)

type Watchlist struct {
	youtubeWatchlistRepository *database.YouTubeWatchlistRepository
	youtubeRepository          *database.YouTubeRepository
	youtubeClient              *providers.Youtube
}

type WatchlistOptions struct {
	YouTubeWatchlistRepository *database.YouTubeWatchlistRepository
	YouTubeRepository          *database.YouTubeRepository
	YouTubeClient              *providers.Youtube
}

func NewWatchlist(opt WatchlistOptions) *Watchlist {
	return &Watchlist{
		youtubeWatchlistRepository: opt.YouTubeWatchlistRepository,
		youtubeRepository:          opt.YouTubeRepository,
		youtubeClient:              opt.YouTubeClient,
	}
}

func (y *Watchlist) Add(videoID string) (*database.YouTubeWatchlist, error) {
	watchlistItem, err := y.youtubeWatchlistRepository.Create(database.YouTubeWatchlist{
		VideoID: videoID,
	})
	if err != nil {
		return nil, err
	}

	service, err := y.youtubeClient.GetService(context.Background())
	if err != nil {
		return nil, err
	}

	video, err := y.youtubeClient.GetVideoDetails(service, videoID)
	if err != nil {
		return nil, err
	}

	publishedAt, err := time.Parse(time.RFC3339, video.Snippet.PublishedAt)
	if err != nil {
		log.Printf("[WARN] Unable to parse published at: %v", err)
		publishedAt = time.Now()
	}

	channel, err := y.youtubeRepository.GetChannelByID(video.Snippet.ChannelId)
	if err != nil {
		return nil, err
	}

	if channel == nil {
		channel, err = y.youtubeRepository.CreateChannel(&database.YouTubeChannel{
			ID:           video.Snippet.ChannelId,
			Title:        video.Snippet.ChannelTitle,
			PreviewURL:   video.Snippet.Thumbnails.Medium.Url,
			IsSubscribed: false,
		})
		if err != nil {
			return nil, err
		}
	}

	err = y.youtubeRepository.CreateVideo(database.YouTubeVideo{
		ID:    videoID,
		Title: video.Snippet.Title,
		Channel: database.YouTubeChannel{
			ID:    video.Snippet.ChannelId,
			Title: channel.Title,
		},
		ChannelID:   video.Snippet.ChannelId,
		Thumbnail:   video.Snippet.Thumbnails.Medium.Url,
		URL:         fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoID),
		PublishedAt: publishedAt,
		SyncAt:      time.Now().Local().String(),
		IsShorts:    false,
	})

	return watchlistItem, nil
}
