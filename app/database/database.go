package database

import (
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

func NewSqliteDB(file string) (*sqlx.DB, error) {
	return sqlx.Connect("sqlite", file)
}
