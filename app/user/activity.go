package user

import "content-oracle/app/database"

type Activity struct {
	blockedVideoRepository   *database.BlockedVideoRepository
	blockedChannelRepository *database.BlockedChannelRepository
}

func NewActivity(
	blockedVideoRepository *database.BlockedVideoRepository,
	blockedChannelRepository *database.BlockedChannelRepository,
) *Activity {
	return &Activity{
		blockedChannelRepository: blockedChannelRepository,
		blockedVideoRepository:   blockedVideoRepository,
	}
}

func (s *Activity) BlockChannel(channelID, status string) (*database.BlockedChannel, error) {
	return s.blockedChannelRepository.Create(database.BlockedChannel{
		ChannelID: channelID,
		Status:    status,
	})
}

func (s *Activity) BlockVideo(videoID, status string) (*database.BlockedVideo, error) {
	return s.blockedVideoRepository.Create(database.BlockedVideo{
		VideoID: videoID,
		Status:  status,
	})
}
