package youtube

import (
	"content-oracle/app/store/settings"
	"content-oracle/app/store/youtubeRanking"
	"golang.org/x/net/context"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	"google.golang.org/api/youtube/v3"
	"log"
	"os"
	"time"
)

type Client struct {
	rankingRepository  *youtubeRanking.Repository
	settingsRepository *settings.Repository
	tokenSource        oauth2.TokenSource
	oauthConfig        *oauth2.Config
}

type ClientOptions struct {
	ClientID           string
	ClientSecret       string
	RedirectURI        string
	ConfigPath         string
	SettingsRepository *settings.Repository
	RankingRepository  *youtubeRanking.Repository
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

	token := &oauth2.Token{
		RefreshToken: appSettings.YoutubeRefreshToken,
		AccessToken:  appSettings.YoutubeAccessToken,
		TokenType:    "Bearer",
		Expiry:       time.Time{}.Add(1),
	}
	tokenSource := config.TokenSource(context.Background(), token)

	return &Client{
		settingsRepository: opt.SettingsRepository,
		rankingRepository:  opt.RankingRepository,
		tokenSource:        tokenSource,
		oauthConfig:        config,
	}, nil
}

func (c *Client) HandleAuthCode(code string) error {
	ctx := context.Background()
	token, err := c.oauthConfig.Exchange(ctx, code)
	if err != nil {
		log.Printf("[ERROR] Unable to retrieve token from web: %v", err)
		return err
	}

	c.tokenSource = c.oauthConfig.TokenSource(ctx, token)
	err = c.settingsRepository.UpdateYoutubeSettings(&settings.Settings{
		YoutubeAccessToken:  token.AccessToken,
		YoutubeRefreshToken: token.RefreshToken,
	})
	if err != nil {
		log.Printf("[ERROR] Unable to update youtube settings: %v", err)
		return err
	}

	return nil
}

func (c *Client) getService(ctx context.Context) (*youtube.Service, error) {
	token, err := c.tokenSource.Token()
	if err != nil {
		log.Printf("[ERROR] Unable to retrieve token: %v", err)
		return nil, err
	}

	newToken, err := oauth2.ReuseTokenSource(token, c.tokenSource).Token()
	if err != nil {
		log.Printf("[ERROR] Unable to refresh token: %v", err)
		return nil, err
	}

	err = c.settingsRepository.UpdateYoutubeSettings(&settings.Settings{
		YoutubeAccessToken:  newToken.AccessToken,
		YoutubeRefreshToken: newToken.RefreshToken,
	})
	if err != nil {
		log.Printf("[ERROR] Unable to update youtube settings: %v", err)
		return nil, err
	}

	service, err := youtube.NewService(ctx, option.WithHTTPClient(c.oauthConfig.Client(ctx, newToken)))
	if err != nil {
		log.Printf("[ERROR] Unable to create youtube client: %v", err)
		return nil, err
	}

	return service, nil
}

func (c *Client) GetUserSubscriptions() ([]*youtube.Subscription, error) {
	ctx := context.Background()
	service, err := c.getService(ctx)
	if err != nil {
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

func (c *Client) GetRanking() ([]youtubeRanking.Ranking, error) {
	return c.rankingRepository.GetAll()
}

func (c *Client) UpdateRanking(ranking []youtubeRanking.Ranking) error {
	return c.rankingRepository.BatchUpdate(ranking)
}
