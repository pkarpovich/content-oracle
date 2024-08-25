package content

import (
	"content-oracle/app/providers/twitch"
	yt "content-oracle/app/providers/youtube"
	"content-oracle/app/providers/zima"
	"content-oracle/app/store/activity"
	"context"
	"fmt"
	"google.golang.org/api/youtube/v3"
	"log"
	"regexp"
	"slices"
	"sort"
	"strconv"
	"strings"
	"time"
)

const YoutubeApplicationName = "YouTube (com.google.ios.youtube)"
const MaxSuggestions = 20

type Client struct {
	twitchClient  *twitch.Client
	zimaClient    *zima.Client
	youtubeClient *yt.Client
	activeRepo    *activity.Repository
}

type ClientOptions struct {
	YouTubeClient *yt.Client
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
	history, err := c.zimaClient.GetContent(false, YoutubeApplicationName)
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
	history, err := c.zimaClient.GetContent(false, YoutubeApplicationName)
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

			content = append(content, convertYoutubeVideoToContent(video, "YouTube Suggestions"))
		}
	}

	sort.Slice(content, func(i, j int) bool {
		return content[i].PublishedAt > content[j].PublishedAt
	})

	return content, nil
}

type HistoryItem struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Arist       string `json:"artist"`
	Thumbnail   string `json:"thumbnail"`
	Url         string `json:"url"`
	PublishedAt string `json:"publishedAt"`
	Application string `json:"application"`
}

type HistoryPlaybackItem struct {
	ContentID  string    `json:"contentId"`
	StartTime  time.Time `json:"startTime"`
	FinishTime time.Time `json:"finishTime"`
}

type HistoryPlayback struct {
	ContentID  string    `json:"contentId"`
	StartTime  time.Time `json:"startTime"`
	FinishTime time.Time `json:"finishTime"`
}

type FullHistory struct {
	Items    []HistoryItem     `json:"items"`
	Playback []HistoryPlayback `json:"playback"`
}

func (c *Client) GetFullHistory() (*FullHistory, error) {
	fullHistory, err := c.zimaClient.GetContent(true, "")
	if err != nil {
		log.Printf("[ERROR] failed to get youtube history: %s", err)
		return nil, err
	}

	allPlayback := make([]zima.Playback, 0)

	for _, item := range fullHistory {
		for _, playback := range item.Playback {
			allPlayback = append(allPlayback, playback)
		}
	}

	sort.Slice(allPlayback, func(i, j int) bool {
		return allPlayback[i].UpdatedAt > allPlayback[j].UpdatedAt
	})

	playback := make([]HistoryPlayback, 0)
	for index, item := range allPlayback {
		updatedAt, err := time.Parse(time.RFC3339, item.UpdatedAt)
		if err != nil {
			log.Printf("[ERROR] failed to parse updated at time: %s", err)
			continue
		}

		if index == 0 || playback[len(playback)-1].ContentID != item.ContentID {
			playback = append(playback, HistoryPlayback{
				ContentID:  item.ContentID,
				StartTime:  updatedAt,
				FinishTime: updatedAt,
			})
			continue
		}

		playback[len(playback)-1].StartTime = updatedAt
	}

	var history []HistoryItem

	for _, item := range fullHistory {
		historyItem := HistoryItem{
			ID:          item.ID,
			Title:       item.Title,
			Arist:       item.Artist,
			Application: item.Application,
		}

		if item.Metadata != nil {
			historyItem.Thumbnail = item.Metadata.PosterLink
			historyItem.Url = item.Metadata.ContentUrl
		}

		history = append(history, historyItem)
	}

	return &FullHistory{
		Playback: playback,
		Items:    history,
	}, nil
}

type PlaybackInfo struct {
	StartTime  int
	TotalTime  int
	Percentage float64
}

func parsePlayback(playbackStr string) (*PlaybackInfo, error) {
	if playbackStr == "Unknown" {
		return &PlaybackInfo{
			StartTime:  0,
			TotalTime:  0,
			Percentage: 0,
		}, nil
	}

	// parse this playback string  6949s
	if regexp.MustCompile(`^\d+s$`).MatchString(playbackStr) {
		playbackStr = "0/" + playbackStr + " (0%)"
	}

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

func (c *Client) GetVideoFromUnsubscribeChannels() ([]Content, error) {
	history, err := c.zimaClient.GetContent(false, YoutubeApplicationName)
	if err != nil {
		log.Printf("[ERROR] failed to get youtube history: %s", err)
		return nil, err
	}

	youtubeService, err := c.youtubeClient.GetService(context.Background())
	if err != nil {
		log.Printf("[ERROR] failed to get youtube service: %s", err)
		return nil, err
	}

	content := make([]Content, 0)

	subscriptions, err := c.youtubeClient.GetUserSubscriptions(youtubeService)
	if err != nil {
		log.Printf("[ERROR] failed to get user subscriptions: %s", err)
		return nil, err
	}

	allHistoryChannels := make([]string, 0)
	for _, item := range history {
		if slices.Contains(allHistoryChannels, item.Artist) {
			continue
		}

		if item.Metadata != nil {
			allHistoryChannels = append(allHistoryChannels, item.Artist)
		}
	}

	unsubscribedChannels := make([]string, 0)
	for _, historyChannel := range allHistoryChannels {
		if !slices.ContainsFunc(subscriptions, func(subscription *youtube.Subscription) bool {
			return subscription.Snippet.Title == historyChannel
		}) {
			unsubscribedChannels = append(unsubscribedChannels, historyChannel)
		}
	}

	for _, channel := range unsubscribedChannels {
		if len(content) >= MaxSuggestions {
			break
		}

		unsubscribedChannel, err := c.youtubeClient.GetChannelByName(youtubeService, channel)
		if err != nil {
			log.Printf("[ERROR] failed to get channel by name: %s", err)
			continue
		}

		if unsubscribedChannel == nil {
			log.Printf("[ERROR] channel not found: %s", channel)
			continue
		}

		videos, err := c.youtubeClient.GetChannelVideos(youtubeService, unsubscribedChannel.ChannelId)
		if err != nil {
			log.Printf("[ERROR] failed to get channel videos: %s", err)
			continue
		}

		for _, video := range videos {
			if alreadyInHistory := slices.ContainsFunc(history, func(item zima.Content) bool {
				return item.Metadata != nil && item.Metadata.VideoID == video.ContentDetails.Upload.VideoId
			}); alreadyInHistory {
				continue
			}

			content = append(content, convertYoutubeVideoToContent(video, "Unsubscribed Channels"))
		}
	}

	sort.Slice(content, func(i, j int) bool {
		return content[i].PublishedAt > content[j].PublishedAt
	})

	return content, nil
}

func convertYoutubeVideoToContent(video *youtube.Activity, category string) Content {
	return Content{
		ID:          video.ContentDetails.Upload.VideoId,
		Title:       video.Snippet.Title,
		Thumbnail:   video.Snippet.Thumbnails.Medium.Url,
		Url:         fmt.Sprintf("https://www.youtube.com/watch?v=%s", video.ContentDetails.Upload.VideoId),
		IsLive:      false,
		Position:    0,
		Category:    category,
		PublishedAt: video.Snippet.PublishedAt,
	}
}
