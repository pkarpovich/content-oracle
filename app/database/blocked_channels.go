package database

import "github.com/jmoiron/sqlx"

const BlockedChannelsSchema = `
	CREATE TABLE IF NOT EXISTS blocked_channels (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		channel_id TEXT UNIQUE NOT NULL,
		status TEXT NOT NULL,
	    FOREIGN KEY (channel_id) REFERENCES youtube_channel(id)
	);
`

type BlockedChannel struct {
	ID        int            `json:"id" db:"id"`
	Channel   YouTubeChannel `json:"channel" db:"channel"`
	ChannelID string         `json:"channelId" db:"channel_id"`
	Status    string         `json:"status" db:"status"`
}

type BlockedChannelRepository struct {
	db *sqlx.DB
}

func NewBlockedChannelRepository(db *sqlx.DB) (*BlockedChannelRepository, error) {
	_, err := db.Exec(BlockedChannelsSchema)
	if err != nil {
		return nil, err
	}

	return &BlockedChannelRepository{db: db}, nil
}

func (b *BlockedChannelRepository) Create(blockedChannel BlockedChannel) (*BlockedChannel, error) {
	query := `INSERT INTO blocked_channels (channel_id, status) VALUES (?, ?)`

	result, err := b.db.Exec(query, blockedChannel.ChannelID, blockedChannel.Status)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	blockedChannel.ID = int(id)

	return &blockedChannel, nil
}
