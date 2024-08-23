package activity

import (
	"content-oracle/app/database"
	"log"
)

type Repository struct {
	db *database.Client
}

type Activity struct {
	ID        int    `json:"id"`
	ContentID string `json:"contentId"`
	Status    string `json:"status"`
}

func NewRepository(db *database.Client) (*Repository, error) {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS activity (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		content_id TEXT,
		status TEXT
	);`)
	if err != nil {
		return nil, err
	}

	return &Repository{db: db}, nil
}

func (r *Repository) GetAll() ([]Activity, error) {
	activities := make([]Activity, 0)
	rows, err := r.db.Query(`SELECT id, content_id, status FROM activity`)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := rows.Close(); err != nil {
			log.Printf("[ERROR] Error closing rows: %s", err)
		}
	}()

	for rows.Next() {
		var activity Activity
		if err := rows.Scan(&activity.ID, &activity.ContentID, &activity.Status); err != nil {
			return nil, err
		}
		activities = append(activities, activity)
	}

	return activities, nil
}

func (r *Repository) Create(activity Activity) (*Activity, error) {
	result, err := r.db.Exec(`INSERT INTO activity (content_id, status) VALUES (?, ?)`, activity.ContentID, activity.Status)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	activity.ID = int(id)

	return &activity, nil
}
