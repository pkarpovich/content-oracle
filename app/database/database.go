package database

import (
	"fmt"
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
	"os"
)

func NewSqliteDB(file string) (*sqlx.DB, error) {
	dbFolder := ".db"
	if err := createFolderIfNotExists(dbFolder); err != nil {
		return nil, err
	}

	dbPath := fmt.Sprintf("%s/%s", dbFolder, file)

	return sqlx.Connect("sqlite", dbPath)
}

func createFolderIfNotExists(folder string) error {
	if _, err := os.Stat(folder); os.IsNotExist(err) {
		return os.Mkdir(folder, os.ModePerm)
	}

	return nil
}
