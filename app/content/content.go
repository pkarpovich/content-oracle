package content

import (
	"content-oracle/app/providers/twitch"
	"fmt"
	"strings"
)

type Client struct {
	twitchClient *twitch.Client
}

func NewClient(twitchClient *twitch.Client) *Client {
	return &Client{twitchClient: twitchClient}
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

		width := "150"
		height := "220"
		url := strings.Replace(urlTemplate, "{width}", width, 1)
		url = strings.Replace(url, "{height}", height, 1)

		content = append(content, Content{
			ID:          stream.ID,
			Title:       stream.Title,
			Description: "",
			Thumbnail:   url,
			Url:         fmt.Sprintf("https://twitch.tv/%s", stream.UserLogin),
			IsLive:      true,
		})
	}

	return content, nil
}
