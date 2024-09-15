package sync

import (
	"content-oracle/app/database"
	"content-oracle/app/providers/youtube"
	"content-oracle/app/providers/zima"
	"context"
	"log"
	"slices"
	"strings"
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
	channels, err := c.prepareChannelsList(ctx)
	if err != nil {
		return err
	}

	log.Printf("[INFO] Found %d channels to sync", len(channels))

	return nil
}

func (c *YouTubeProvider) prepareChannelsList(ctx context.Context) ([]string, error) {
	allChannels := make([]string, 0)

	rankingChannels, err := c.processRankingChannels()
	if err != nil {
		return allChannels, err
	}

	allChannels = append(allChannels, rankingChannels...)

	historyChannels, err := c.processHistoryContent(ctx)
	if err != nil {
		return allChannels, err
	}

	allChannels = append(allChannels, historyChannels...)
	allChannels = dedupeSlice(allChannels)

	return allChannels, nil
}

func (c *YouTubeProvider) processRankingChannels() ([]string, error) {
	rankingChannels := make([]string, 0)

	ranking, err := c.youtubeClient.GetRanking()
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

func (c *YouTubeProvider) processHistoryContent(ctx context.Context) ([]string, error) {
	youtubeService, err := c.youtubeClient.GetService(ctx)
	if err != nil {
		log.Printf("[ERROR] failed to get youtube service: %s", err)
		return nil, err
	}

	historyChannels := make([]string, 0)

	historyContent, err := c.zimaClient.GetContent(false, YoutubeApplicationName)
	if err != nil {
		log.Printf("[ERROR] failed to get history content: %s", err)
		return historyChannels, err
	}

	for _, content := range historyContent {
		if content.Artist == "" {
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

			channel, err = c.youtubeRepository.CreateChannel(&database.YouTubeChannel{
				ID:    contentResp.Id,
				Title: strings.TrimSpace(contentResp.Snippet.Title),
				Name:  contentResp.Snippet.CustomUrl,
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
