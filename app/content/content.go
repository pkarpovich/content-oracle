package content

import (
	"content-oracle/app/providers/twitch"
	"content-oracle/app/providers/zima"
	"fmt"
	"log"
	"strings"
)

type Client struct {
	twitchClient *twitch.Client
	zimaClient   *zima.Client
}

type ClientOptions struct {
	TwitchClient *twitch.Client
	ZimaClient   *zima.Client
}

func NewClient(opt *ClientOptions) *Client {
	return &Client{twitchClient: opt.TwitchClient, zimaClient: opt.ZimaClient}
}

type Content struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Thumbnail   string `json:"thumbnail"`
	Url         string `json:"url"`
	IsLive      bool   `json:"isLive"`
}

func (c *Client) GetAll() ([]Content, error) {
	resp, err := c.twitchClient.GetLiveStreams()
	if err != nil {
		return nil, err
	}

	var content []Content
	for _, stream := range resp.Data.Streams {
		urlTemplate := stream.ThumbnailURL

		width := "320"
		height := "180"
		url := strings.Replace(urlTemplate, "{width}", width, 1)
		url = strings.Replace(url, "{height}", height, 1)

		content = append(content, Content{
			ID:          stream.ID,
			Title:       stream.Title,
			Description: "",
			Thumbnail:   url,
			Url:         fmt.Sprintf("https://www.twitch.tv/%s", stream.UserLogin),
			IsLive:      true,
		})
	}

	return content, nil
}

func (c *Client) OpenContentUrl(url string) error {
	return c.zimaClient.OpenUrl(url)
}

func (c *Client) GetYoutubeHistory() ([]Content, error) {
	history, err := c.zimaClient.GetContent()
	if err != nil {
		log.Printf("[ERROR] failed to get youtube history: %s", err)
		return nil, err
	}

	var content []Content

	for _, item := range history {
		if item.Metadata == nil {
			continue
		}

		content = append(content, Content{
			ID:          item.ID,
			Title:       item.Title,
			Description: item.Artist,
			Thumbnail:   item.Metadata.PosterLink,
			Url:         item.Metadata.ContentUrl,
			IsLive:      false,
		})
	}

	return content, nil
}
