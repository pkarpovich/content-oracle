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
	"strings"
	"sync"
	"time"
)

type Client struct {
	rankingRepository  *youtubeRanking.Repository
	settingsRepository *settings.Repository
	tokenSource        oauth2.TokenSource
	oauthConfig        *oauth2.Config
	cache              sync.Map
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

func (c *Client) GetService(ctx context.Context) (*youtube.Service, error) {
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

func (c *Client) GetUserSubscriptions(service *youtube.Service) ([]*youtube.Subscription, error) {
	cacheKey := "youtube_subscriptions"

	if items, ok := c.getFromCache(cacheKey); ok {
		return items.([]*youtube.Subscription), nil
	}

	ctx := context.Background()

	part := []string{"snippet"}
	call := service.Subscriptions.List(part)
	call.Mine(true)

	var channels = make([]*youtube.Subscription, 0)

	if err := call.Pages(ctx, func(page *youtube.SubscriptionListResponse) error {
		channels = append(channels, page.Items...)

		return nil
	}); err != nil {
		return nil, err
	}

	c.storeInCache(cacheKey, channels)

	return channels, nil
}

func (c *Client) GetChannelVideos(service *youtube.Service, channelId string) ([]*youtube.Activity, error) {
	cacheKey := "youtube_channel_videos_" + channelId

	if items, ok := c.getFromCache(cacheKey); ok {
		return items.([]*youtube.Activity), nil
	}

	ctx := context.Background()

	part := []string{"snippet", "contentDetails"}
	call := service.Activities.List(part)
	call.ChannelId(channelId)
	call.PublishedAfter(time.Now().Add(time.Duration(-7) * time.Hour * 24).Format(time.RFC3339))

	var videos = make([]*youtube.Activity, 0)

	if err := call.Pages(ctx, func(page *youtube.ActivityListResponse) error {
		for _, item := range page.Items {
			if item.Snippet.Type != "upload" || item.Snippet.Description == "" {
				continue
			}

			videos = append(videos, item)
		}

		return nil
	}); err != nil {
		return nil, err
	}

	if len(videos) == 0 {
		return nil, nil
	}

	videos, err := c.filterShortVideos(ctx, service, videos)
	if err != nil {
		return nil, err
	}

	c.storeInCache(cacheKey, videos)

	return videos, nil
}

func (c *Client) filterShortVideos(ctx context.Context, service *youtube.Service, videos []*youtube.Activity) ([]*youtube.Activity, error) {
	var filteredVideos = make([]*youtube.Activity, 0)

	var videoIds = make([]string, 0)
	for _, video := range videos {
		videoIds = append(videoIds, video.ContentDetails.Upload.VideoId)
	}

	call := service.Videos.List([]string{"contentDetails"}).Id(videoIds...)

	var videoDetails = make([]*youtube.Video, 0)
	if err := call.Pages(ctx, func(page *youtube.VideoListResponse) error {
		videoDetails = append(videoDetails, page.Items...)

		return nil
	}); err != nil {
		return filteredVideos, err
	}

	for _, video := range videoDetails {
		var originalVideo *youtube.Activity
		for _, v := range videos {
			if v.ContentDetails.Upload.VideoId == video.Id {
				originalVideo = v
				break
			}
		}
		if originalVideo == nil {
			continue
		}

		duration, err := time.ParseDuration(parseISO8601Duration(video.ContentDetails.Duration))
		if err != nil {
			log.Printf("[ERROR] Failed to parse duration: %v", err)
			continue
		}

		if duration > time.Minute {
			filteredVideos = append(filteredVideos, originalVideo)
		}
	}

	return filteredVideos, nil
}

func parseISO8601Duration(duration string) string {
	duration = strings.ToLower(duration)
	duration = strings.Replace(duration, "pt", "", 1)
	duration = strings.Replace(duration, "h", "h", 1)
	duration = strings.Replace(duration, "m", "m", 1)
	duration = strings.Replace(duration, "s", "s", 1)

	return duration
}

func (c *Client) GetRanking() ([]youtubeRanking.Ranking, error) {
	return c.rankingRepository.GetAll()
}

func (c *Client) UpdateRanking(ranking []youtubeRanking.Ranking) error {
	return c.rankingRepository.BatchUpdate(ranking)
}

type CacheItem struct {
	Items      interface{}
	Expiration time.Time
}

func (c *Client) getFromCache(key string) (interface{}, bool) {
	item, ok := c.cache.Load(key)
	if !ok {
		return nil, false
	}

	cacheItem := item.(CacheItem)
	if cacheItem.Expiration.Before(time.Now()) {
		c.cache.Delete(key)
		return nil, false
	}

	return cacheItem.Items, true
}

func (c *Client) storeInCache(key string, value interface{}) {
	c.cache.Store(key, CacheItem{
		Items:      value,
		Expiration: time.Now().Add(1 * time.Hour),
	})
}
