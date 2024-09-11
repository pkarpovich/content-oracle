package database

import "github.com/jmoiron/sqlx"

type ActivityRepository struct {
	db *sqlx.DB
}

const ActivitySchema = `
	CREATE TABLE IF NOT EXISTS activity (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		content_id TEXT,
		status TEXT
	);
`

type Activity struct {
	ID        int    `json:"id" db:"id"`
	ContentID string `json:"contentId" db:"content_id"`
	Status    string `json:"status" db:"status"`
}

func NewActivityRepository(db *sqlx.DB) (*ActivityRepository, error) {
	_, err := db.Exec(ActivitySchema)
	if err != nil {
		return nil, err
	}

	return &ActivityRepository{db: db}, nil
}

func (a *ActivityRepository) GetAll() ([]Activity, error) {
	entities := make([]Activity, 0)

	if err := a.db.Select(&entities, "SELECT * FROM activity"); err != nil {
		return nil, err
	}

	return entities, nil
}

func (a *ActivityRepository) Create(activity Activity) (*Activity, error) {
	query := `INSERT INTO activity (content_id, status) VALUES (?, ?)`

	result, err := a.db.Exec(query, activity.ContentID, activity.Status)
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
