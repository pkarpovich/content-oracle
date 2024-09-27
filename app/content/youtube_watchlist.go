package content

import (
	"content-oracle/app/database"
)

type YouTubeWatchlist struct {
	youtubeRepository *database.YouTubeRepository
}

func NewYouTubeWatchlist(youtubeRepository *database.YouTubeRepository) *YouTubeWatchlist {
	return &YouTubeWatchlist{
		youtubeRepository: youtubeRepository,
	}
}

func (y *YouTubeWatchlist) GetAll(ignoredVideoIDs []string) ([]Content, error) {
	var content []Content

	videos, err := y.youtubeRepository.GetWatchlistVideos(ignoredVideoIDs)
	if err != nil {
		return nil, err
	}

	for _, video := range videos {
		content = append(content, YoutubeVideoToContent(video, "YouTube Watchlist"))
	}

	return content, nil
}
