package providers

import (
	"content-oracle/app/database"
	"github.com/nicklaw5/helix/v2"
	"log"
)

type Twitch struct {
	settingsRepository *database.SettingsRepository
	helix              *helix.Client
	userId             string
}

type TwitchOptions struct {
	RedirectURI        string
	ClientSecret       string
	ClientID           string
	UserId             string
	SettingsRepository *database.SettingsRepository
}

func NewTwitch(opt *TwitchOptions) (*Twitch, error) {
	client, err := helix.NewClient(&helix.Options{
		RedirectURI:  opt.RedirectURI,
		ClientID:     opt.ClientID,
		ClientSecret: opt.ClientSecret,
	})
	if err != nil {
		return nil, err
	}

	appSettings, err := opt.SettingsRepository.Read()
	if err != nil {
		return nil, err
	}

	if appSettings == nil {
		err := opt.SettingsRepository.Init()
		if err != nil {
			return nil, err
		}

		appSettings, err = opt.SettingsRepository.Read()
		if err != nil {
			return nil, err
		}
	}

	if appSettings != nil && appSettings.TwitchAccessToken != "" {
		client.SetUserAccessToken(appSettings.TwitchAccessToken)
		client.SetRefreshToken(appSettings.TwitchRefreshToken)
	} else {
		url := client.GetAuthorizationURL(&helix.AuthorizationURLParams{
			ResponseType: "code",
			Scopes:       []string{"user:read:follows"},
		})

		log.Printf("No Twitch access token found in settings")
		log.Printf("Authorization URL: %s", url)
	}

	return &Twitch{
		settingsRepository: opt.SettingsRepository,
		userId:             opt.UserId,
		helix:              client,
	}, nil
}

func (c *Twitch) GetLiveStreams() (*helix.StreamsResponse, error) {
	resp, err := c.helix.GetFollowedStream(&helix.FollowedStreamsParams{
		UserID: c.userId,
	})
	if err != nil {
		return nil, err
	}

	return resp, nil
}

func (c *Twitch) SetAuthToken(code string) error {
	resp, err := c.helix.RequestUserAccessToken(code)
	if err != nil {
		return err
	}

	err = c.settingsRepository.SetTwitchSettings(database.Settings{
		TwitchAccessToken:  resp.Data.AccessToken,
		TwitchRefreshToken: resp.Data.RefreshToken,
	})
	if err != nil {
		return err
	}

	c.helix.SetUserAccessToken(resp.Data.AccessToken)
	c.helix.SetRefreshToken(resp.Data.RefreshToken)

	return nil
}

func (c *Twitch) GetAuthURL() string {
	return c.helix.GetAuthorizationURL(&helix.AuthorizationURLParams{
		ResponseType: "code",
		Scopes:       []string{"user:read:follows"},
	})
}
