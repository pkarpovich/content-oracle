package user

import "content-oracle/app/database"

type Activity struct {
	activityRepository *database.ActivityRepository
}

func NewActivity(activityRepository *database.ActivityRepository) *Activity {
	return &Activity{
		activityRepository: activityRepository,
	}
}

func (s *Activity) Create(contentID, status string) (*database.Activity, error) {
	return s.activityRepository.Create(database.Activity{
		ContentID: contentID,
		Status:    status,
	})
}
