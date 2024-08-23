package content

import (
	"content-oracle/app/providers/twitch"
	"content-oracle/app/providers/youtube"
	"content-oracle/app/providers/zima"
	"content-oracle/app/store/activity"
	"context"
	"fmt"
	"log"
	"regexp"
	"slices"
	"sort"
	"strconv"
	"strings"
)

type Client struct {
	twitchClient  *twitch.Client
	zimaClient    *zima.Client
	youtubeClient *youtube.Client
	activeRepo    *activity.Repository
}

type ClientOptions struct {
	YouTubeClient *youtube.Client
	ActivityRepo  *activity.Repository
	TwitchClient  *twitch.Client
	ZimaClient    *zima.Client
}

func NewClient(opt *ClientOptions) *Client {
	return &Client{
		youtubeClient: opt.YouTubeClient,
		twitchClient:  opt.TwitchClient,
		zimaClient:    opt.ZimaClient,
		activeRepo:    opt.ActivityRepo,
	}
}

type Content struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Thumbnail   string  `json:"thumbnail"`
	Url         string  `json:"url"`
	IsLive      bool    `json:"isLive"`
	Position    float64 `json:"position"`
	Category    string  `json:"category"`
	PublishedAt string  `json:"publishedAt"`
}

func (c *Client) GetAll() ([]Content, error) {
	resp, err := c.twitchClient.GetLiveStreams()
	if err != nil {
		return nil, err
	}

	var content []Content
	for _, stream := range resp.Data.Streams {
		urlTemplate := stream.ThumbnailURL

		width := "1280"
		height := "720"
		url := strings.Replace(urlTemplate, "{width}", width, 1)
		url = strings.Replace(url, "{height}", height, 1)

		content = append(content, Content{
			ID:        stream.ID,
			Title:     stream.Title,
			Thumbnail: url,
			Url:       fmt.Sprintf("https://www.twitch.tv/%s", stream.UserLogin),
			IsLive:    true,
			Category:  "Live Streams",
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

	videoActivity, err := c.activeRepo.GetAll()
	if err != nil {
		log.Printf("[ERROR] failed to get video activity: %s", err)
		return nil, err
	}

	var content []Content

	for _, item := range history {
		if item.Metadata == nil {
			continue
		}

		if itemActivityIndex := slices.IndexFunc(videoActivity, func(activity activity.Activity) bool {
			return activity.ContentID == item.ID
		}); videoActivity != nil && itemActivityIndex != -1 && videoActivity[itemActivityIndex].Status == "completed" {
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
			ID:        item.ID,
			Title:     item.Title,
			Thumbnail: item.Metadata.PosterLink,
			Url:       item.Metadata.ContentUrl,
			IsLive:    false,
			Position:  playbackPosition,
			Category:  "YouTube History",
		})
	}

	return content, nil
}

func (c *Client) CreateActivity(contentID string, status string) (*activity.Activity, error) {
	return c.activeRepo.Create(activity.Activity{
		ContentID: contentID,
		Status:    status,
	})
}

func (c *Client) GetYoutubeSuggestions() ([]Content, error) {
	history, err := c.zimaClient.GetContent()
	if err != nil {
		log.Printf("[ERROR] failed to get youtube history: %s", err)
		return nil, err
	}

	ranking, err := c.youtubeClient.GetRanking()
	if err != nil {
		log.Printf("[ERROR] failed to get youtube ranking: %s", err)
		return nil, err
	}

	var content []Content
	const MaxSuggestions = 20

	youtubeService, err := c.youtubeClient.GetService(context.Background())
	if err != nil {
		log.Printf("[ERROR] failed to get youtube service: %s", err)
		return nil, err
	}

	for _, rank := range ranking {
		if len(content) >= MaxSuggestions {
			break
		}

		videos, err := c.youtubeClient.GetChannelVideos(youtubeService, rank.ID)
		if err != nil {
			log.Printf("[ERROR] failed to get channel videos: %s", err)
			continue
		}

		for _, video := range videos {
			videoId := video.ContentDetails.Upload.VideoId
			if videoId == "" {
				continue
			}

			if slices.ContainsFunc(history, func(item zima.Content) bool {
				return item.Metadata != nil && item.Metadata.VideoID == videoId
			}) {
				continue
			}

			content = append(content, Content{
				ID:          videoId,
				Title:       video.Snippet.Title,
				Thumbnail:   video.Snippet.Thumbnails.Medium.Url,
				Url:         fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoId),
				IsLive:      false,
				Position:    0,
				Category:    "YouTube Suggestions",
				PublishedAt: video.Snippet.PublishedAt,
			})
		}
	}

	sort.Slice(content, func(i, j int) bool {
		return content[i].PublishedAt > content[j].PublishedAt
	})

	return content, nil
}

type PlaybackInfo struct {
	StartTime  int
	TotalTime  int
	Percentage float64
}

func parsePlayback(playbackStr string) (*PlaybackInfo, error) {
	regex := regexp.MustCompile(`(\d+)/(\d+)s \(([\d.]+)%\)`)
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
