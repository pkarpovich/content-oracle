package youtube

import (
	"content-oracle/app/store/settings"
	"golang.org/x/net/context"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	"google.golang.org/api/youtube/v3"
	"log"
	"os"
)

type Client struct {
	oauthConfig        *oauth2.Config
	accessToken        string
	settingsRepository *settings.Repository
}

type ClientOptions struct {
	ClientID           string
	ClientSecret       string
	RedirectURI        string
	ConfigPath         string
	SettingsRepository *settings.Repository
}

func NewClient(opt *ClientOptions) (*Client, error) {
	b, err := os.ReadFile(opt.ConfigPath)
	if err != nil {
		log.Printf("[ERROR] Unable to read client secret file: %v", err)
		return nil, err
	}

	config, err := google.ConfigFromJSON(b, youtube.YoutubeReadonlyScope)
	if err != nil {
		log.Printf("[ERROR] Unable to parse client secret file to config: %v", err)
		return nil, err
	}

	appSettings, err := opt.SettingsRepository.GetSettings()
	if err != nil {
		log.Printf("[ERROR] Unable to get youtube settings: %v", err)
		return nil, err
	}

	if appSettings == nil {
		log.Printf("[ERROR] No youtube settings found")
		return nil, err
	}

	if appSettings.YoutubeAccessToken == "" {
		authURL := config.AuthCodeURL(
			"state-token",
			oauth2.AccessTypeOffline,
			oauth2.SetAuthURLParam("prompt", "consent"),
		)
		log.Printf("Youtube auth URL: %v", authURL)
	}

	return &Client{
		oauthConfig: &oauth2.Config{
			ClientID:     opt.ClientID,
			ClientSecret: opt.ClientSecret,
			RedirectURL:  opt.RedirectURI,
			Scopes:       []string{youtube.YoutubeReadonlyScope},
			Endpoint:     google.Endpoint,
		},
		settingsRepository: opt.SettingsRepository,
		accessToken:        appSettings.YoutubeAccessToken,
	}, nil
}

func (c *Client) HandleAuthCode(code string) error {
	ctx := context.Background()
	token, err := c.oauthConfig.Exchange(ctx, code)
	if err != nil {
		log.Printf("[ERROR] Unable to retrieve token from web: %v", err)
		return err
	}

	c.accessToken = token.AccessToken
	err = c.settingsRepository.UpdateYoutubeSettings(&settings.Settings{
		YoutubeAccessToken: token.AccessToken,
	})
	if err != nil {
		log.Printf("[ERROR] Unable to update youtube settings: %v", err)
		return err
	}

	return nil
}

func (c *Client) GetUserSubscriptions() ([]*youtube.Subscription, error) {
	ctx := context.Background()

	service, err := youtube.NewService(ctx, option.WithTokenSource(
		c.oauthConfig.TokenSource(ctx, &oauth2.Token{
			AccessToken: c.accessToken,
		}),
	))
	if err != nil {
		log.Printf("[ERROR] Unable to create youtube client: %v", err)
		return nil, err
	}

	part := []string{"snippet"}
	call := service.Subscriptions.List(part)
	call.Mine(true)

	var channels = make([]*youtube.Subscription, 0)

	err = call.Pages(ctx, func(page *youtube.SubscriptionListResponse) error {
		channels = append(channels, page.Items...)

		return nil
	})

	return channels, nil
}
