package database

import (
	"github.com/jmoiron/sqlx"
	"log"
)

type YouTubeRepository struct {
	db *sqlx.DB
}

const YouTubeChannelSchema = `
	CREATE TABLE IF NOT EXISTS youtube_channel (
		id TEXT PRIMARY KEY,
		title TEXT,
		name TEXT
	)
`

const YouTubeVideoSchema = `
	CREATE TABLE IF NOT EXISTS youtube_video (
		id TEXT PRIMARY KEY,
		title TEXT,
		channel_id TEXT,
		thumbnail TEXT,
		url TEXT,
		published_at TEXT,
		length TEXT,                     
        FOREIGN KEY (channel_id) REFERENCES youtube_channel(id)    	
	)
`

const YouTubeRankingSchema = `
	CREATE TABLE IF NOT EXISTS youtube_ranking (
		id TEXT PRIMARY KEY,
		rank INTEGER
	);
`

type YouTubeChannel struct {
	ID    string `json:"id" db:"id"`
	Title string `json:"title" db:"title"`
	Name  string `json:"name" db:"name"`
}

type YouTubeVideo struct {
	ID          string `json:"id" db:"id"`
	Title       string `json:"title" db:"title"`
	ChannelID   string `json:"channelId" db:"channel_id"`
	Thumbnail   string `json:"thumbnail" db:"thumbnail"`
	URL         string `json:"url" db:"url"`
	PublishedAt string `json:"publishedAt" db:"published_at"`
	Length      string `json:"length" db:"length"`
}

type YouTubeRanking struct {
	ID   string `json:"id" db:"id"`
	Rank int    `json:"rank" db:"rank"`
}

func NewYoutubeRepository(db *sqlx.DB) (*YouTubeRepository, error) {
	_, err := db.Exec(YouTubeChannelSchema)
	if err != nil {
		log.Printf("[ERROR] Error creating youtube_channel table: %s", err)
		return nil, err
	}

	_, err = db.Exec(YouTubeVideoSchema)
	if err != nil {
		log.Printf("[ERROR] Error creating youtube_video table: %s", err)
		return nil, err
	}

	_, err = db.Exec(YouTubeRankingSchema)
	if err != nil {
		log.Printf("[ERROR] Error creating youtube_ranking table: %s", err)
		return nil, err
	}

	return &YouTubeRepository{db: db}, nil
}

func (y *YouTubeRepository) Close() error {
	return y.db.Close()
}

func (y *YouTubeRepository) GetChannelByTitle(title string) (*YouTubeChannel, error) {
	var channel YouTubeChannel
	err := y.db.Get(&channel, "SELECT * FROM youtube_channel WHERE title = ?", title)
	if err != nil {
		log.Printf("[ERROR] Error getting channel by title: %s", err)
		return nil, err
	}

	return &channel, nil
}

func (y *YouTubeRepository) CreateChannel(channel YouTubeChannel) error {
	query := `INSERT INTO youtube_channel (id, title, name) VALUES (?, ?, ?)`
	_, err := y.db.Exec(query, channel.ID, channel.Title, channel.Name)
	if err != nil {
		log.Printf("[ERROR] Error inserting channel: %s", err)
		return err
	}

	return nil
}

func (y *YouTubeRepository) CreateVideo(video YouTubeVideo) error {
	query := `INSERT INTO youtube_video (id, title, channel_id, thumbnail, url, published_at, length) VALUES (?, ?, ?, ?, ?, ?, ?)`
	_, err := y.db.Exec(query, video.ID, video.Title, video.ChannelID, video.Thumbnail, video.URL, video.PublishedAt, video.Length)
	if err != nil {
		log.Printf("[ERROR] Error inserting video: %s", err)
		return err
	}

	return nil
}

func (y *YouTubeRepository) GetVideoByID(id string) (*YouTubeVideo, error) {
	var video YouTubeVideo
	err := y.db.Get(&video, "SELECT * FROM youtube_video WHERE id = ?", id)
	if err != nil {
		log.Printf("[ERROR] Error getting video by id: %s", err)
		return nil, err
	}

	return &video, nil
}

func (y *YouTubeRepository) GetAllRanking() ([]YouTubeRanking, error) {
	rankings := make([]YouTubeRanking, 0)
	err := y.db.Select(&rankings, "SELECT * FROM youtube_ranking ORDER BY rank desc")
	if err != nil {
		log.Printf("[ERROR] Error getting all rankings: %s", err)
		return nil, err
	}

	return rankings, nil
}

func (y *YouTubeRepository) BatchUpdateRanking(rankings []YouTubeRanking) error {
	tx, err := y.db.Begin()
	if err != nil {
		log.Printf("[ERROR] Error beginning transaction: %s", err)
		return err
	}

	query := `INSERT INTO youtube_ranking (id, rank) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET rank = ?`
	for _, ranking := range rankings {
		_, err := tx.Exec(query, ranking.ID, ranking.Rank, ranking.Rank)
		if err != nil {
			if err := tx.Rollback(); err != nil {
				log.Printf("[ERROR] Error rolling back transaction: %s", err)
			}

			log.Printf("[ERROR] Error inserting ranking: %s", err)
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		log.Printf("[ERROR] Error committing transaction: %s", err)
	}

	return err
}
