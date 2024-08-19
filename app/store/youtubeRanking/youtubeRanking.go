package youtubeRanking

import (
	"content-oracle/app/database"
	"log"
)

type Repository struct {
	db *database.Client
}

type Ranking struct {
	ID   string `json:"id"`
	Rank int    `json:"rank"`
}

func NewRepository(db *database.Client) (*Repository, error) {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS youtube_ranking (
		id TEXT PRIMARY KEY,
		rank INTEGER
	);`)
	if err != nil {
		return nil, err
	}

	return &Repository{db: db}, nil
}

func (r *Repository) GetAll() ([]Ranking, error) {
	rankings := make([]Ranking, 0)
	rows, err := r.db.Query(`SELECT id, rank FROM youtube_ranking ORDER BY rank`)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := rows.Close(); err != nil {
			log.Printf("[ERROR] Error closing rows: %s", err)
		}
	}()

	for rows.Next() {
		var ranking Ranking
		if err := rows.Scan(&ranking.ID, &ranking.Rank); err != nil {
			return nil, err
		}
		rankings = append(rankings, ranking)
	}

	return rankings, nil
}

func (r *Repository) BatchUpdate(rankings []Ranking) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}

	for _, ranking := range rankings {
		_, err := tx.Exec(`INSERT INTO youtube_ranking (id, rank) VALUES (?, ?)
			ON CONFLICT(id) DO UPDATE SET rank = ?`, ranking.ID, ranking.Rank, ranking.Rank)
		if err != nil {
			if err := tx.Rollback(); err != nil {
				log.Printf("[ERROR] Error rolling back transaction: %s", err)
			}

			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}
