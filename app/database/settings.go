package database

import (
	"github.com/jmoiron/sqlx"
	"time"
)

type SettingsRepository struct {
	db *sqlx.DB
}

const SettingsSchema = `
	CREATE TABLE IF NOT EXISTS settings (
		id INTEGER PRIMARY KEY,
		twitch_access_token TEXT DEFAULT '',
		twitch_refresh_token TEXT DEFAULT '',
		youtube_access_token TEXT DEFAULT '',
		youtube_refresh_token TEXT DEFAULT '',
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP	
	);
`

type Settings struct {
	ID                  int    `json:"_" db:"id"`
	TwitchAccessToken   string `json:"twitchAccessToken" db:"twitch_access_token"`
	TwitchRefreshToken  string `json:"twitchRefreshToken" db:"twitch_refresh_token"`
	YoutubeAccessToken  string `json:"youtubeAccessToken" db:"youtube_access_token"`
	YoutubeRefreshToken string `json:"youtubeRefreshToken" db:"youtube_refresh_token"`
	UpdatedAt           string `json:"updatedAt" db:"updated_at"`
}

const DefaultSettingsID = 1

func NewSettingsRepository(db *sqlx.DB) (*SettingsRepository, error) {
	_, err := db.Exec(SettingsSchema)
	if err != nil {
		return nil, err
	}

	return &SettingsRepository{db: db}, nil
}

func (s *SettingsRepository) Read() (*Settings, error) {
	var settings Settings

	if err := s.db.Get(&settings, "SELECT * FROM settings WHERE id = ?", DefaultSettingsID); err != nil {
		return nil, err
	}

	return &settings, nil
}

func (s *SettingsRepository) SetTwitchSettings(settings Settings) error {
	updateTime := time.Now().Format("2006-01-02 15:04:05")
	query := `UPDATE settings SET twitch_access_token = ?, twitch_refresh_token = ? WHERE id = ?`

	_, err := s.db.Exec(query, settings.TwitchAccessToken, settings.TwitchRefreshToken, updateTime, DefaultSettingsID)

	return err
}

func (s *SettingsRepository) SetYoutubeSettings(settings Settings) error {
	updateTime := time.Now().Format("2006-01-02 15:04:05")
	query := `UPDATE settings SET youtube_access_token = ?, youtube_refresh_token = ?, updated_at = ? WHERE id = ?`

	_, err := s.db.Exec(query, settings.YoutubeAccessToken, settings.YoutubeRefreshToken, updateTime, DefaultSettingsID)

	return err
}
