package database

import "github.com/jmoiron/sqlx"

const BlockedVideosSchema = `
	CREATE TABLE IF NOT EXISTS blocked_videos (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		video_id TEXT UNIQUE NOT NULL,
		status TEXT NOT NULL,
		FOREIGN KEY (video_id) REFERENCES youtube_video(id)
	);
`

type BlockedVideo struct {
	ID      int          `json:"id" db:"id"`
	Video   YouTubeVideo `json:"video" db:"video"`
	VideoID string       `json:"videoId" db:"video_id"`
	Status  string       `json:"status" db:"status"`
}

type BlockedVideoRepository struct {
	db *sqlx.DB
}

func NewBlockedVideoRepository(db *sqlx.DB) (*BlockedVideoRepository, error) {
	_, err := db.Exec(BlockedVideosSchema)
	if err != nil {
		return nil, err
	}

	return &BlockedVideoRepository{db: db}, nil
}

func (b *BlockedVideoRepository) Create(blockedVideo BlockedVideo) (*BlockedVideo, error) {
	query := `INSERT INTO blocked_videos (video_id, status) VALUES (?, ?)`

	result, err := b.db.Exec(query, blockedVideo.VideoID, blockedVideo.Status)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	blockedVideo.ID = int(id)

	return &blockedVideo, nil
}

func (b *BlockedVideoRepository) GetAll() ([]BlockedVideo, error) {
	query := `SELECT * FROM blocked_videos`

	var blockedVideos []BlockedVideo
	err := b.db.Select(&blockedVideos, query)
	if err != nil {
		return nil, err
	}

	return blockedVideos, nil
}
