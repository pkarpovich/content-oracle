package settings

import (
	"content-oracle/app/database"
	"time"
)

type Repository struct {
	db *database.Client
}

type Settings struct {
	TwitchAccessToken  string
	TwitchRefreshToken string
	UpdatedAt          string
}

const DefaultSettingsID = 1

func NewRepository(db *database.Client) (*Repository, error) {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS settings (
		id INTEGER PRIMARY KEY,
		twitch_access_token TEXT,
		twitch_refresh_token TEXT,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP	
	);`)
	if err != nil {
		return nil, err
	}

	return &Repository{db: db}, nil
}

func (s *Repository) GetSettings() (Settings, error) {
	var settings Settings
	row := s.db.QueryRow(`SELECT twitch_access_token, twitch_refresh_token FROM settings WHERE id = ?`, DefaultSettingsID)
	err := row.Scan(&settings.TwitchAccessToken, &settings.TwitchRefreshToken)
	if err != nil {
		return settings, err
	}

	return settings, nil
}

func (s *Repository) UpdateSettings(settings *Settings) error {
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
        )`,
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
