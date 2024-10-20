package content

import (
	"content-oracle/app/providers"
	"fmt"
	"strings"
)

type Twitch struct {
	client *providers.Twitch
}

type TwitchOptions struct {
	TwitchClient *providers.Twitch
}

func NewTwitch(opt TwitchOptions) *Twitch {
	return &Twitch{
		client: opt.TwitchClient,
	}
}

func (c *Twitch) GetAll(_ []string) ([]Content, error) {
	resp, err := c.client.GetLiveStreams()
	if err != nil {
		return nil, err
	}

	content := make([]Content, 0)
	for _, stream := range resp.Data.Streams {
		urlTemplate := stream.ThumbnailURL

		width := "1280"
		height := "720"
		url := strings.Replace(urlTemplate, "{width}", width, 1)
		url = strings.Replace(url, "{height}", height, 1)

		content = append(content, Content{
			ID:    stream.ID,
			Title: stream.Title,
			Artist: Artist{
				Name: stream.UserName,
			},
			Thumbnail: url,
			Url:       fmt.Sprintf("https://www.twitch.tv/%s", stream.UserLogin),
			IsLive:    true,
			Category:  "Live Streams",
		})
	}

	return content, nil
}
