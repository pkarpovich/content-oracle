package content

import (
	"content-oracle/app/providers/twitch"
	"content-oracle/app/providers/zima"
	"fmt"
	"log"
	"regexp"
	"strconv"
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
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Thumbnail   string  `json:"thumbnail"`
	Url         string  `json:"url"`
	IsLive      bool    `json:"isLive"`
	Position    float64 `json:"position"`
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

		var playbackInfo *PlaybackInfo
		if len(item.Playback) >= 1 {
			playbackInfo, err = parsePlayback(item.Playback[0].Position)
			if err != nil {
				log.Printf("[ERROR] failed to parse playback info: %s", err)
			}

			if playbackInfo != nil {
				remainingTime := playbackInfo.TotalTime - playbackInfo.StartTime

				if remainingTime < 300 {
					continue
				}
			}
		}

		var playbackPosition float64
		if playbackInfo != nil {
			playbackPosition = playbackInfo.Percentage
		}

		content = append(content, Content{
			ID:          item.ID,
			Title:       item.Title,
			Description: item.Artist,
			Thumbnail:   item.Metadata.PosterLink,
			Url:         item.Metadata.ContentUrl,
			IsLive:      false,
			Position:    playbackPosition,
		})
	}

	return content, nil
}

type PlaybackInfo struct {
	StartTime  int
	TotalTime  int
	Percentage float64
}

func parsePlayback(playbackStr string) (*PlaybackInfo, error) {
	regex := regexp.MustCompile(`(\d+)\/(\d+)s \(([\d.]+)%\)`)
	match := regex.FindStringSubmatch(playbackStr)

	if len(match) == 0 {
		return nil, fmt.Errorf("invalid playback string format")
	}

	startTime, err := strconv.Atoi(match[1])
	if err != nil {
		return nil, err
	}

	totalTime, err := strconv.Atoi(match[2])
	if err != nil {
		return nil, err
	}

	percentage, err := strconv.ParseFloat(match[3], 64)
	if err != nil {
		return nil, err
	}

	return &PlaybackInfo{
		StartTime:  startTime,
		TotalTime:  totalTime,
		Percentage: percentage,
	}, nil
}
