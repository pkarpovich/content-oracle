package content

import "content-oracle/app/providers/twitch"

type Client struct {
	twitchClient *twitch.Client
}

func NewClient(twitchClient *twitch.Client) *Client {
	return &Client{twitchClient: twitchClient}
}

type Content struct {
	ID          string
	Title       string
	Description string
	Thumbnail   string
	Url         string
	IsLive      bool
}

func (c *Client) GetAll() ([]Content, error) {
	resp, err := c.twitchClient.GetLiveStreams()
	if err != nil {
		return nil, err
	}

	var content []Content
	for _, stream := range resp.Data.Streams {
		content = append(content, Content{
			ID:          stream.ID,
			Title:       stream.Title,
			Description: "",
			Thumbnail:   stream.ThumbnailURL,
			Url:         stream.UserLogin,
			IsLive:      true,
		})
	}

	return content, nil
}
