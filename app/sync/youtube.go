package sync

import (
	"content-oracle/app/database"
	"content-oracle/app/providers/youtube"
	"content-oracle/app/providers/zima"
	"context"
	"fmt"
	"log"
	"slices"
	"strings"
	"time"
)

const YoutubeApplicationName = "YouTube (com.google.ios.youtube)"

type YouTubeProvider struct {
	youtubeRepository *database.YouTubeRepository
	youtubeClient     *youtube.Client
	zimaClient        *zima.Client
}

type YouTubeProviderOptions struct {
	YoutubeRepository *database.YouTubeRepository
	YoutubeClient     *youtube.Client
	ZimaClient        *zima.Client
}

func NewYouTubeProvider(options YouTubeProviderOptions) *YouTubeProvider {
	return &YouTubeProvider{
		youtubeRepository: options.YoutubeRepository,
		youtubeClient:     options.YoutubeClient,
		zimaClient:        options.ZimaClient,
	}
}

func (c *YouTubeProvider) Do(ctx context.Context) error {
	youtubeService, err := c.youtubeClient.GetService(ctx)
	if err != nil {
		log.Printf("[ERROR] failed to get youtube service: %s", err)
		return err
	}

	channels, err := c.prepareChannelsList(ctx, youtubeService)
	if err != nil {
		return err
	}

	log.Printf("[INFO] Found %d channels to sync", len(channels))

	for _, channelID := range channels {
		channelLastPublishedAt, err := c.youtubeRepository.GetChannelLastPublishedAt(channelID)
		if err != nil {
			log.Printf("[ERROR] failed to get channel last sync at: %s", err)
			continue
		}

		// Add a minute to the last published at time to avoid getting the same video again
		if channelLastPublishedAt != nil && !channelLastPublishedAt.IsZero() {
			updatedTime := channelLastPublishedAt.Add(time.Minute)
			*channelLastPublishedAt = updatedTime
		}

		channelVideos, err := c.youtubeClient.GetChannelVideos(youtubeService, channelID, channelLastPublishedAt)
		if err != nil {
			log.Printf("[ERROR] failed to get channel videos: %s", err)
			continue
		}

		for _, channelVideo := range channelVideos {
			id := channelVideo.ContentDetails.Upload.VideoId
			video, err := c.youtubeRepository.GetVideoByID(id)
			if err != nil {
				log.Printf("[ERROR] Error getting video by id: %s", err)
				continue
			}

			if video != nil {
				continue
			}
			log.Printf("[INFO] Video does not exist: %s", id)

			isShorts, err := c.youtubeClient.IsShortVideo(youtubeService, channelVideo)
			if err != nil {
				log.Printf("[ERROR] Error checking if video is short: %s", err)
				continue
			}

			url := fmt.Sprintf("https://www.youtube.com/watch?v=%s", id)
			publishedAt, err := time.Parse(time.RFC3339, channelVideo.Snippet.PublishedAt)
			if err != nil {
				log.Printf("[ERROR] Error parsing published at: %s", err)
				continue
			}

			err = c.youtubeRepository.CreateVideo(database.YouTubeVideo{
				Title:       channelVideo.Snippet.Title,
				ChannelID:   channelVideo.Snippet.ChannelId,
				Thumbnail:   channelVideo.Snippet.Thumbnails.Medium.Url,
				PublishedAt: publishedAt,
				IsShorts:    isShorts,
				URL:         url,
				ID:          id,
			})
			if err != nil {
				log.Printf("[ERROR] Error creating video: %s", err)
			}
		}
	}

	log.Printf("[INFO] Finished syncing YouTube")

	return nil
}

func (c *YouTubeProvider) prepareChannelsList(ctx context.Context, youtubeService *youtube.Service) ([]string, error) {
	allChannels := make([]string, 0)

	rankingChannels, err := c.processRankingChannels()
	if err != nil {
		return allChannels, err
	}

	allChannels = append(allChannels, rankingChannels...)

	historyChannels, err := c.processHistoryContent(ctx, youtubeService)
	if err != nil {
		return allChannels, err
	}

	allChannels = append(allChannels, historyChannels...)
	allChannels = dedupeSlice(allChannels)

	return allChannels, nil
}

func (c *YouTubeProvider) processRankingChannels() ([]string, error) {
	rankingChannels := make([]string, 0)

	ranking, err := c.youtubeRepository.GetAllRanking()
	if err != nil {
		log.Printf("[ERROR] failed to get ranking: %s", err)
		return rankingChannels, err
	}

	for _, rank := range ranking {
		if rank.Rank > 0 {
			rankingChannels = append(rankingChannels, rank.ID)
		}
	}

	return rankingChannels, nil
}

func (c *YouTubeProvider) processHistoryContent(ctx context.Context, youtubeService *youtube.Service) ([]string, error) {
	historyChannels := make([]string, 0)

	historyContent, err := c.zimaClient.GetContent(false, YoutubeApplicationName)
	if err != nil {
		log.Printf("[ERROR] failed to get history content: %s", err)
		return historyChannels, err
	}

	for _, content := range historyContent {
		if content.Artist == "" || content.Artist == "Unknown" {
			continue
		}

		channel, err := c.youtubeRepository.GetChannelByTitle(content.Artist)
		if err != nil {
			log.Printf("[ERROR] Error getting channel by title: %s", err)
			continue
		}

		if channel == nil && content.Metadata != nil {
			contentResp, err := c.youtubeClient.GetChannelByVideoId(youtubeService, content.Metadata.VideoID)
			if err != nil {
				log.Printf("[ERROR] Error getting channel by name: %s", err)
				continue
			}

			if contentResp == nil {
				continue
			}

			isSubscribed, err := c.youtubeClient.IsUserSubscribed(youtubeService, contentResp.Id)
			if err != nil {
				log.Printf("[ERROR] Error checking if user is subscribed: %s", err)
			}

			channel, err = c.youtubeRepository.CreateChannel(&database.YouTubeChannel{
				ID:           contentResp.Id,
				Title:        strings.TrimSpace(contentResp.Snippet.Title),
				PreviewURL:   contentResp.Snippet.Thumbnails.Medium.Url,
				IsSubscribed: isSubscribed,
			})
			if err != nil {
				log.Printf("[ERROR] Error creating channel: %s %s", contentResp.Snippet.Title, err)
				continue
			}
		}

		if channel == nil || slices.Contains(historyChannels, channel.ID) {
			continue
		}

		historyChannels = append(historyChannels, channel.ID)
	}

	return historyChannels, nil
}

func dedupeSlice[T comparable](sliceList []T) []T {
	dedupeMap := make(map[T]struct{})
	var list []T

	for _, slice := range sliceList {
		if _, exists := dedupeMap[slice]; !exists {
			dedupeMap[slice] = struct{}{}
			list = append(list, slice)
		}
	}

	return list
}
