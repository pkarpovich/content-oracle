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

func (y *YouTubeHistory) GetAll() ([]Content, error) {
	history, err := y.zimaClient.GetContent(false, YoutubeApplicationName)
	if err != nil {
		log.Printf("[ERROR] failed to get youtube history: %s", err)
		return nil, err
	}

	blockedVideos, err := y.blockedVideoRepository.GetAll()
	if err != nil {
		log.Printf("[ERROR] failed to get video activity: %s", err)
		return nil, err
	}

	var content []Content

	for _, item := range history {
		if item.Metadata == nil {
			continue
		}

		if lo.ContainsBy(blockedVideos, func(video database.BlockedVideo) bool {
			return video.VideoID == item.ID
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
			Artist:      Artist{Name: item.Artist},
			Thumbnail:   item.Metadata.PosterLink,
			Url:         item.Metadata.ContentUrl,
			IsLive:      false,
			Position:    playbackPosition,
			Category:    "YouTube History",
			PublishedAt: lastPlaybackAt,
		})
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
