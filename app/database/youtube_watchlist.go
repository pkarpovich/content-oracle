package database

import "github.com/jmoiron/sqlx"

const YouTubeWatchlistSchema = `
	CREATE TABLE IF NOT EXISTS youtube_watchlist (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		video_id TEXT UNIQUE NOT NULL
	)
`

type YouTubeWatchlist struct {
	ID      int    `json:"id" db:"id"`
	VideoID string `json:"videoId" db:"video_id"`
}

type YouTubeWatchlistRepository struct {
	db *sqlx.DB
}

func NewYouTubeWatchlistRepository(db *sqlx.DB) (*YouTubeWatchlistRepository, error) {
	_, err := db.Exec(YouTubeWatchlistSchema)
	if err != nil {
		return nil, err
	}

	return &YouTubeWatchlistRepository{db: db}, nil
}

func (y *YouTubeWatchlistRepository) Create(youtubeWatchlist YouTubeWatchlist) (*YouTubeWatchlist, error) {
	query := `INSERT INTO youtube_watchlist (video_id) VALUES (?)`

	result, err := y.db.Exec(query, youtubeWatchlist.VideoID)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	youtubeWatchlist.ID = int(id)

	return &youtubeWatchlist, nil
}
