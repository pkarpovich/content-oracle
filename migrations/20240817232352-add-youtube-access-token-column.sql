-- +migrate Up
ALTER TABLE settings ADD COLUMN youtube_access_token TEXT DEFAULT '';

-- +migrate Down
ALTER TABLE settings DROP COLUMN youtube_access_token;
