package content

import (
	"content-oracle/app/database"
	"content-oracle/app/providers/zima"
	"fmt"
	"github.com/samber/lo"
	"log"
	"regexp"
	"sort"
	"strconv"
	"time"
)

const YoutubeApplicationName = "YouTube (com.google.ios.youtube)"
const RemainingTimeThreshold = 300

type YouTubeHistory struct {
	blockedVideoRepository *database.BlockedVideoRepository
	zimaClient             *zima.Client
}

type YouTubeHistoryOptions struct {
	BlockedVideoRepository *database.BlockedVideoRepository
	ZimaClient             *zima.Client
}

func NewYouTubeHistory(opt YouTubeHistoryOptions) *YouTubeHistory {
	return &YouTubeHistory{
		blockedVideoRepository: opt.BlockedVideoRepository,
		zimaClient:             opt.ZimaClient,
	}
}

func (y *YouTubeHistory) GetAll() ([]Content, []string, error) {
	allHistoryIds := make([]string, 0)
	history, err := y.zimaClient.GetContent(false, YoutubeApplicationName)
	if err != nil {
		log.Printf("[ERROR] failed to get youtube history: %s", err)
		return nil, allHistoryIds, err
	}

	for _, item := range history {
		if item.Metadata == nil {
			continue
		}

		allHistoryIds = append(allHistoryIds, item.Metadata.VideoID)
	}

	blockedVideos, err := y.blockedVideoRepository.GetAll()
	if err != nil {
		log.Printf("[ERROR] failed to get video activity: %s", err)
		return nil, allHistoryIds, err
	}

	var content []Content

	for _, item := range history {
		if item.Metadata == nil {
			continue
		}

		if lo.ContainsBy(blockedVideos, func(video database.BlockedVideo) bool {
			return video.VideoID == item.Metadata.VideoID
		}) {
			continue
		}

		lastPlaybackAt := item.CreatedAt
		var playbackInfo *PlaybackInfo
		if len(item.Playback) >= 1 {
			lastPlaybackAt = item.Playback[0].UpdatedAt
			updatedAt, err := time.Parse(time.RFC3339, item.Playback[0].UpdatedAt)
			if err != nil {
				log.Printf("[ERROR] failed to parse updated at time: %s", err)
				continue
			}

			if time.Now().Sub(updatedAt) > 7*24*time.Hour {
				continue
			}

			playbackInfo, err = parsePlayback(item.Playback[0].Position)
			if err != nil {
				log.Printf("[ERROR] failed to parse playback info: %s", err)
			}
		}

		var playbackPosition float64
		var remaining int
		if playbackInfo != nil {
			playbackPosition = playbackInfo.Percentage
			remaining = playbackInfo.TotalTime - playbackInfo.StartTime
		}

		content = append(content, Content{
			ID:          item.Metadata.VideoID,
			Title:       item.Title,
			Artist:      Artist{Name: item.Artist},
			Thumbnail:   item.Metadata.PosterLink,
			Url:         item.Metadata.ContentUrl,
			IsLive:      false,
			Remaining:   remaining,
			Position:    playbackPosition,
			Category:    "YouTube History",
			PublishedAt: lastPlaybackAt,
		})
	}

	sort.Slice(content, func(i, j int) bool {
		return content[i].PublishedAt > content[j].PublishedAt
	})

	content = lo.Filter(content, func(item Content, _ int) bool {
		return item.Remaining > RemainingTimeThreshold
	})

	return content, allHistoryIds, nil
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
