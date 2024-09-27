
-- +migrate Up
ALTER TABLE youtube_channel DROP COLUMN name;

-- +migrate Down
ALTER TABLE youtube_channel ADD COLUMN name TEXT DEFAULT '';
