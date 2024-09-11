package youtubeSync

import (
	"content-oracle/app/database"
	"content-oracle/app/providers/youtube"
	"content-oracle/app/providers/zima"
	"context"
	"log"
)

const YoutubeApplicationName = "YouTube (com.google.ios.youtube)"

type Client struct {
	youtubeRepository *database.YouTubeRepository
	youtubeClient     *youtube.Client
	zimaClient        *zima.Client
}

type ClientOptions struct {
	YoutubeRepository *database.YouTubeRepository
	YoutubeClient     *youtube.Client
	ZimaClient        *zima.Client
}

func NewClient(options ClientOptions) *Client {
	return &Client{
		youtubeRepository: options.YoutubeRepository,
		youtubeClient:     options.YoutubeClient,
		zimaClient:        options.ZimaClient,
	}
}

func (c *Client) Sync(ctx context.Context) error {
	youtubeService, err := c.youtubeClient.GetService(ctx)
	if err != nil {
		log.Printf("[ERROR] failed to get youtube service: %s", err)
		return err
	}

	ranking, err := c.youtubeRepository.GetAllRanking()
	if err != nil {
		return err
	}

	for _, rank := range ranking {
		log.Printf("[INFO] Syncing youtube channel with id: %s %v", rank.ID, rank.Rank)
	}

	historyContent, err := c.zimaClient.GetContent(false, YoutubeApplicationName)
	if err != nil {
		return err
	}

	allChannels := make([]string, 0)

	for _, content := range historyContent {
		if content.Artist == "" {
			continue
		}

		channel, err := c.youtubeRepository.GetChannelByTitle(content.Artist)
		if err != nil {
			log.Printf("[ERROR] Error getting channel by title: %s", err)
			continue
		}

		if channel == nil {
			contentResp, err := c.youtubeClient.GetChannelByName(youtubeService, content.Artist)
			if err != nil {
				log.Printf("[ERROR] Error getting channel by name: %s", err)
				continue
			}

			if contentResp == nil {
				continue
			}

			err = c.youtubeRepository.CreateChannel(database.YouTubeChannel{
				ID:    contentResp.ChannelId,
				Title: contentResp.ChannelTitle,
				Name:  contentResp.Title,
			})
			if err != nil {
				log.Printf("[ERROR] Error creating channel: %s", err)
				continue
			}
		}

		allChannels = append(allChannels, content.Artist)
	}

	return nil
}
