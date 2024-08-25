package settings

import (
	"content-oracle/app/database"
	"log"
	"time"
)

type Repository struct {
	db *database.Client
}

type Settings struct {
	TwitchAccessToken   string
	TwitchRefreshToken  string
	YoutubeAccessToken  string
	YoutubeRefreshToken string
	UpdatedAt           string
}

const DefaultSettingsID = 1

func NewRepository(db *database.Client) (*Repository, error) {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS settings (
		id INTEGER PRIMARY KEY,
		twitch_access_token TEXT DEFAULT '',
		twitch_refresh_token TEXT DEFAULT '',
		youtube_access_token TEXT DEFAULT '',
		youtube_refresh_token TEXT DEFAULT '',
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP	
	);`)
	if err != nil {
		return nil, err
	}

	return &Repository{db: db}, nil
}

func (s *Repository) GetSettings() (*Settings, error) {
	var settings Settings
	row := s.db.QueryRow(`SELECT
		twitch_access_token,
		twitch_refresh_token,
		youtube_access_token,
		youtube_refresh_token 
		FROM settings WHERE id = ?`, DefaultSettingsID)
	if err := row.Err(); err != nil {
		return nil, err
	}

	err := row.Scan(
		&settings.TwitchAccessToken,
		&settings.TwitchRefreshToken,
		&settings.YoutubeAccessToken,
		&settings.YoutubeRefreshToken,
	)
	if err != nil {
		log.Printf("[ERROR] Error scanning settings: %s", err)
		return nil, nil
	}

	return &settings, nil
}

func (s *Repository) UpdateTwitchSettings(settings *Settings) error {
	_, err := s.db.Exec(`INSERT INTO settings (
    		id,
            twitch_access_token,
            twitch_refresh_token,
            updated_at
        ) VALUES (
            ?,
            ?,
            ?,
            ?
        ) ON CONFLICT(id) DO UPDATE SET
			twitch_access_token = excluded.twitch_access_token,
			twitch_refresh_token = excluded.twitch_refresh_token,
			updated_at = excluded.updated_at`,
		DefaultSettingsID,
		settings.TwitchAccessToken,
		settings.TwitchRefreshToken,
		time.Now().Format("2006-01-02 15:04:05"),
	)
	if err != nil {
		return err
	}

	return nil
}

func (s *Repository) UpdateYoutubeSettings(settings *Settings) error {
	_, err := s.db.Exec(`INSERT INTO settings (
			id,
			youtube_access_token,
            youtube_refresh_token,
			updated_at
		) VALUES (
			?,
			?,
			?,
			?
		) ON CONFLICT(id) DO UPDATE SET
			youtube_access_token = excluded.youtube_access_token,
			youtube_refresh_token = excluded.youtube_refresh_token,
			updated_at = excluded.updated_at`,
		DefaultSettingsID,
		settings.YoutubeAccessToken,
		settings.YoutubeRefreshToken,
		time.Now().Format("2006-01-02 15:04:05"),
	)
	if err != nil {
		return err
	}

	return nil
}
