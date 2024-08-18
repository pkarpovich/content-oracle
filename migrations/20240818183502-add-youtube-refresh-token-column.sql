-- +migrate Up
ALTER TABLE settings ADD COLUMN youtube_refresh_token TEXT DEFAULT '';

-- +migrate Down
ALTER TABLE settings DROP COLUMN youtube_refresh_token;
