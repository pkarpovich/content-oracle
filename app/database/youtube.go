package database

import (
	"database/sql"
	"errors"
	"fmt"
	"github.com/jmoiron/sqlx"
	"log"
	"strings"
	"time"
)

type YouTubeRepository struct {
	db *sqlx.DB
}

const YouTubeChannelSchema = `
	CREATE TABLE IF NOT EXISTS youtube_channel (
		id TEXT PRIMARY KEY,
		title TEXT,
		preview_url TEXT,
	    is_subscribed BOOLEAN DEFAULT TRUE                                       
	)
`

const YouTubeVideoSchema = `
	CREATE TABLE IF NOT EXISTS youtube_video (
		id TEXT PRIMARY KEY,
		title TEXT,
		channel_id TEXT,
		thumbnail TEXT,
		url TEXT,
		published_at TIMESTAMP,
		is_shorts BOOLEAN DEFAULT FALSE,
		sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                     
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
	ID           string `json:"id" db:"id"`
	Title        string `json:"title" db:"title"`
	PreviewURL   string `json:"previewUrl" db:"preview_url"`
	IsSubscribed bool   `json:"isSubscribed" db:"is_subscribed"`
}

type YouTubeVideo struct {
	ID          string         `json:"id" db:"id"`
	Title       string         `json:"title" db:"title"`
	Channel     YouTubeChannel `json:"channel" db:"channel"`
	ChannelID   string         `json:"channelId" db:"channel_id"`
	Thumbnail   string         `json:"thumbnail" db:"thumbnail"`
	URL         string         `json:"url" db:"url"`
	PublishedAt time.Time      `json:"publishedAt" db:"published_at"`
	SyncAt      string         `json:"syncAt" db:"sync_at"`
	IsShorts    bool           `json:"isShorts" db:"is_shorts"`
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
	err := y.db.Get(&channel, "SELECT * FROM youtube_channel WHERE title = ?", strings.TrimSpace(title))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		log.Printf("[ERROR] Error getting channel by title: %s", err)
		return nil, err
	}

	return &channel, nil
}

func (y *YouTubeRepository) GetChannelByID(id string) (*YouTubeChannel, error) {
	var channel YouTubeChannel
	err := y.db.Get(&channel, "SELECT * FROM youtube_channel WHERE id = ?", id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		log.Printf("[ERROR] Error getting channel by id: %s", err)
		return nil, err
	}

	return &channel, nil
}

func (y *YouTubeRepository) GetAllSubscribedChannels() ([]YouTubeChannel, error) {
	channels := make([]YouTubeChannel, 0)
	err := y.db.Select(&channels, "SELECT * FROM youtube_channel WHERE is_subscribed = TRUE")
	if err != nil {
		log.Printf("[ERROR] Error getting all subscribed channels: %s", err)
		return nil, err
	}

	return channels, nil
}

func (y *YouTubeRepository) CreateChannel(channel *YouTubeChannel) (*YouTubeChannel, error) {
	query := `INSERT INTO youtube_channel (id, title, is_subscribed, preview_url) VALUES (?, ?, ?, ?)`
	_, err := y.db.Exec(query, channel.ID, channel.Title, channel.IsSubscribed, channel.PreviewURL)
	if err != nil {
		return nil, err
	}

	return channel, nil
}

func (y *YouTubeRepository) CreateVideo(video YouTubeVideo) error {
	query := `INSERT INTO youtube_video (id, title, channel_id, thumbnail, url, published_at, is_shorts) VALUES (?, ?, ?, ?, ?, ?, ?)`
	_, err := y.db.Exec(query, video.ID, video.Title, video.ChannelID, video.Thumbnail, video.URL, video.PublishedAt, video.IsShorts)
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
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		log.Printf("[ERROR] Error getting video by id: %s", err)
		return nil, err
	}

	return &video, nil
}

func (y *YouTubeRepository) GetChannelVideos(channelID string, publishedAfter time.Time, ignoredVideoIDs []string) ([]YouTubeVideo, error) {
	videos := make([]YouTubeVideo, 0)
	query := `  SELECT 
      					v.id as id,
      					v.title as title,
      					v.thumbnail as thumbnail,
      					v.channel_id as channel_id,
      					v.url as url,
      					v.published_at as published_at,
      					v.is_shorts as is_shorts,
      					v.sync_at as sync_at,
      					c.id as "channel.id",
      					c.title as "channel.title",
      					c.preview_url as "channel.preview_url",
      					c.is_subscribed as "channel.is_subscribed"
				FROM youtube_video v
					INNER JOIN youtube_channel c ON v.channel_id = c.id
					LEFT JOIN blocked_channels bc ON c.id = bc.channel_id
        			LEFT JOIN blocked_videos bv ON v.id = bv.video_id
				WHERE v.channel_id = ? 
					AND v.published_at > ? 
					AND v.is_shorts = FALSE
					AND bc.channel_id IS NULL
					AND bv.video_id IS NULL
	`

	if len(ignoredVideoIDs) > 0 {
		placeholders := make([]string, len(ignoredVideoIDs))
		for i := range ignoredVideoIDs {
			placeholders[i] = "?"
		}

		query += fmt.Sprintf(" AND v.id NOT IN (%s)", strings.Join(placeholders, ","))
	}

	args := []interface{}{channelID, publishedAfter}
	for _, id := range ignoredVideoIDs {
		args = append(args, id)
	}

	err := y.db.Select(&videos, query, args...)
	if err != nil {
		log.Printf("[ERROR] Error getting channel videos: %s", err)
		return nil, err
	}

	return videos, nil
}

const MaxVideosFromChannel = 3
const TotalAmountOfVideos = 20

func (y *YouTubeRepository) GetTopRankedChannelVideos(publishedAfter time.Time, ignoredVideoIDs []string) ([]YouTubeVideo, error) {
	videos := make([]YouTubeVideo, 0)

	placeholders := make([]string, len(ignoredVideoIDs))
	for i := range ignoredVideoIDs {
		placeholders[i] = "?"
	}

	query := fmt.Sprintf(`
		SELECT q.video_id              as id,
			   q.video_title           as title,
			   q.video_thumbnail       as thumbnail,
			   q.vidoe_url             as url,
			   q.vidoe_published_at    as published_at,
			   q.vidoe_is_shorts       as is_shorts,
			   q.vidoe_sync_at         as sync_at,
			   q.channel_id            as "channel.id",
			   q.channel_title         as "channel.title",
			   q.channel_preview_url   as "channel.preview_url",
			   q.channel_is_subscribed as "channel.is_subscribed"
		FROM (SELECT v.id                                                               as "video_id",
					 v.title                                                            as "video_title",
					 v.thumbnail                                                        as "video_thumbnail",
					 v.url                                                              as "vidoe_url",
					 v.published_at                                                     as "vidoe_published_at",
					 v.is_shorts                                                        as "vidoe_is_shorts",
					 v.sync_at                                                          as "vidoe_sync_at",
					 c.id                                                               as "channel_id",
					 c.title                                                            as "channel_title",
					 c.preview_url                                                      as "channel_preview_url",
					 c.is_subscribed                                                    as "channel_is_subscribed",
					 r.rank                                                             as rank,
					 ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY v.published_at DESC) as row_num
			  FROM youtube_video v
					   INNER JOIN youtube_ranking r ON v.channel_id = r.id
					   INNER JOIN youtube_channel c ON v.channel_id = c.id
					   LEFT JOIN blocked_channels bc ON c.id = bc.channel_id
					   LEFT JOIN blocked_videos bv ON v.id = bv.video_id
			  WHERE v.is_shorts = FALSE
			    AND v.published_at > ?
				AND bc.channel_id IS NULL
				AND bv.video_id IS NULL
			  	AND v.id NOT IN (%s)) q
		WHERE row_num <= ?
		ORDER BY q.rank DESC, published_at DESC
		LIMIT ?;
	`, strings.Join(placeholders, ","))

	args := []interface{}{publishedAfter}
	for _, id := range ignoredVideoIDs {
		args = append(args, id)
	}
	args = append(args, MaxVideosFromChannel, TotalAmountOfVideos)

	err := y.db.Select(&videos, query, args...)
	if err != nil {
		log.Printf("[ERROR] Error getting top ranked channel videos: %s", err)
		return videos, err
	}

	return videos, nil
}

func (y *YouTubeRepository) GetLastVideosFromUnsubscribedChannels(publishedAfter time.Time, ignoredVideoIDs []string) ([]YouTubeVideo, error) {
	videos := make([]YouTubeVideo, 0)

	placeholders := make([]string, len(ignoredVideoIDs))
	for i := range ignoredVideoIDs {
		placeholders[i] = "?"
	}

	query := fmt.Sprintf(`
		SELECT q.video_id              as id,
			   q.video_title           as title,
			   q.video_thumbnail       as thumbnail,
			   q.vidoe_url             as url,
			   q.vidoe_published_at    as published_at,
			   q.vidoe_is_shorts       as is_shorts,
			   q.vidoe_sync_at         as sync_at,
			   q.channel_id            as "channel.id",
			   q.channel_title         as "channel.title",
			   q.channel_preview_url   as "channel.preview_url",
			   q.channel_is_subscribed as "channel.is_subscribed"
		FROM (SELECT v.id                                                               as "video_id",
					 v.title                                                            as "video_title",
					 v.thumbnail                                                        as "video_thumbnail",
					 v.url                                                              as "vidoe_url",
					 v.published_at                                                     as "vidoe_published_at",
					 v.is_shorts                                                        as "vidoe_is_shorts",
					 v.sync_at                                                          as "vidoe_sync_at",
					 c.id                                                               as "channel_id",
					 c.title                                                            as "channel_title",
					 c.preview_url                                                      as "channel_preview_url",
					 c.is_subscribed                                                    as "channel_is_subscribed",
					 ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY v.published_at DESC) as row_num
			  FROM youtube_channel c
					   INNER JOIN youtube_video v ON c.id = v.channel_id
					   LEFT JOIN blocked_channels bc ON c.id = bc.channel_id
					   LEFT JOIN blocked_videos bv ON v.id = bv.video_id
			  WHERE c.is_subscribed = FALSE
			    AND v.published_at > ?
				AND v.is_shorts = FALSE
				AND bc.channel_id IS NULL
				AND bv.video_id IS NULL
			  	AND v.id NOT IN (%s)) q
		WHERE row_num <= ?
		ORDER BY published_at DESC
		LIMIT ?;
	`, strings.Join(placeholders, ","))

	args := []interface{}{publishedAfter}
	for _, id := range ignoredVideoIDs {
		args = append(args, id)
	}
	args = append(args, MaxVideosFromChannel, TotalAmountOfVideos)

	err := y.db.Select(&videos, query, args...)
	if err != nil {
		log.Printf("[ERROR] Error getting top ranked channel videos: %s", err)
		return videos, err
	}

	return videos, nil
}

func (y *YouTubeRepository) GetWatchlistVideos(ignoredVideoIDs []string) ([]YouTubeVideo, error) {
	videos := make([]YouTubeVideo, 0)

	placeholders := make([]string, len(ignoredVideoIDs))
	for i := range ignoredVideoIDs {
		placeholders[i] = "?"
	}

	query := fmt.Sprintf(`
		SELECT v.id            as id,
			   v.title         as title,
			   v.thumbnail     as thumbnail,
			   v.url           as url,
			   v.published_at  as published_at,
			   v.is_shorts     as is_shorts,
			   v.sync_at       as sync_at,
			   c.id            as "channel.id",
			   c.title         as "channel.title",
			   c.preview_url   as "channel.preview_url",
			   c.is_subscribed as "channel.is_subscribed"
		FROM youtube_video v
				 INNER JOIN youtube_channel c ON v.channel_id = c.id
				 LEFT JOIN youtube_watchlist yw on v.id = yw.video_id
				 LEFT JOIN blocked_channels bc ON c.id = bc.channel_id
				 LEFT JOIN blocked_videos bv ON v.id = bv.video_id
		WHERE yw.id IS NOT NULL
		  AND bc.channel_id IS NULL
		  AND bv.video_id IS NULL
		  AND v.id NOT IN (%s)
	`, strings.Join(placeholders, ","))

	args := make([]interface{}, 0)
	for _, id := range ignoredVideoIDs {
		args = append(args, id)
	}

	err := y.db.Select(&videos, query, args...)
	if err != nil {
		log.Printf("[ERROR] Error getting top ranked channel videos: %s", err)
		return videos, err
	}

	return videos, nil
}

func (y *YouTubeRepository) GetChannelLastPublishedAt(channelID string) (*time.Time, error) {
	var publishedAt time.Time
	query := "SELECT published_at FROM youtube_video WHERE channel_id = ? ORDER BY published_at DESC LIMIT 1"
	err := y.db.Get(&publishedAt, query, channelID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		log.Printf("[ERROR] Error getting channel last sync at: %s", err)
		return nil, err
	}

	return &publishedAt, nil
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
