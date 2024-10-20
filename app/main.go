package main

import (
	"content-oracle/app/config"
	"content-oracle/app/content"
	"content-oracle/app/database"
	"content-oracle/app/http"
	"content-oracle/app/providers"
	"content-oracle/app/scheduler"
	"content-oracle/app/sync"
	"content-oracle/app/user"
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	log.Printf("[INFO] Starting app")

	cfg, err := config.Init()
	if err != nil {
		log.Fatalf("[ERROR] Error reading config: %s", err)
	}

	if err := run(cfg); err != nil {
		log.Fatalf("[ERROR] Error running app: %s", err)
	}
}

func run(cfg *config.Config) error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	done := make(chan struct{})

	db, err := database.NewSqliteDB("content-oracle.db")
	if err != nil {
		log.Printf("[ERROR] Error creating database client: %s", err)
		return err
	}

	settingsRepository, err := database.NewSettingsRepository(db)
	if err != nil {
		log.Printf("[ERROR] Error creating settings repository: %s", err)
		return err
	}

	youTubeRepository, err := database.NewYoutubeRepository(db)
	if err != nil {
		log.Printf("[ERROR] Error creating YouTube repository: %s", err)
		return err
	}

	blockedChannelRepository, err := database.NewBlockedChannelRepository(db)
	if err != nil {
		log.Printf("[ERROR] Error creating blocked channel repository: %s", err)
		return err
	}

	blockedVideoRepository, err := database.NewBlockedVideoRepository(db)
	if err != nil {
		log.Printf("[ERROR] Error creating blocked video repository: %s", err)
		return err
	}

	youtubeWatchlistRepository, err := database.NewYouTubeWatchlistRepository(db)
	if err != nil {
		log.Printf("[ERROR] Error creating YouTube watchlist repository: %s", err)
		return err
	}

	twitchClient, err := providers.NewTwitch(&providers.TwitchOptions{
		SettingsRepository: settingsRepository,
		RedirectURI:        cfg.Twitch.RedirectURI,
		ClientID:           cfg.Twitch.ClientID,
		ClientSecret:       cfg.Twitch.ClientSecret,
		UserId:             cfg.Twitch.UserId,
	})
	if err != nil {
		log.Printf("[ERROR] Error creating Twitch client: %s", err)
		return err
	}

	youtubeClient, err := providers.NewYoutube(&providers.YoutubeOptions{
		ClientID:           cfg.Youtube.ClientID,
		ClientSecret:       cfg.Youtube.ClientSecret,
		RedirectURI:        cfg.Youtube.RedirectURI,
		ConfigPath:         cfg.Youtube.ConfigPath,
		SettingsRepository: settingsRepository,
		YouTubeRepository:  youTubeRepository,
	})
	if err != nil {
		log.Printf("[ERROR] Error creating YouTube client: %s", err)
		return err
	}

	zimaClient := providers.NewZima(cfg.Zima.Url)

	syncYoutubeProvider := sync.NewYouTubeProvider(sync.YouTubeProviderOptions{
		YoutubeRepository: youTubeRepository,
		YoutubeClient:     youtubeClient,
		ZimaClient:        zimaClient,
	})

	twitchContentProvider := content.NewTwitch(content.TwitchOptions{
		TwitchClient: twitchClient,
	})

	youtubeSubscriptionContentProvider := content.NewYouTubeSubscription(content.YouTubeSubscriptionOptions{
		YoutubeRepository: youTubeRepository,
	})

	youtubeUnsubscribeChannelsContentProvider := content.NewYouTubeUnsubscribeChannels(content.YouTubeUnsubscribeChannelsOptions{
		YoutubeRepository: youTubeRepository,
	})

	youtubeWatchlistContentProvider := content.NewYouTubeWatchlist(youTubeRepository)

	contentMultiProvider := content.NewMultiProvider(
		zimaClient,
		blockedVideoRepository,
		twitchContentProvider,
		youtubeWatchlistContentProvider,
		youtubeSubscriptionContentProvider,
		youtubeUnsubscribeChannelsContentProvider,
	)

	esportClient := providers.NewEsport(&providers.ESportOptions{
		ApiKey:  cfg.Esport.ApiKey,
		BaseURL: cfg.Esport.BaseUrl,
		TeamIds: cfg.Esport.Teams,
	})

	esportEventsProvider := content.NewESportEvents(esportClient)
	esportMultiProvider := content.MultiESportProvider{esportEventsProvider}

	userActivity := user.NewActivity(blockedVideoRepository, blockedChannelRepository)
	userHistory := user.NewHistory(zimaClient, cfg.Http.BaseUrl)
	userWatchlist := user.NewWatchlist(user.WatchlistOptions{
		YouTubeWatchlistRepository: youtubeWatchlistRepository,
		YouTubeRepository:          youTubeRepository,
		YouTubeClient:              youtubeClient,
	})

	schedulerClient := scheduler.NewClient()
	err = schedulerClient.Start(syncYoutubeProvider.Do, context.Background())
	if err != nil {
		log.Printf("[ERROR] Error starting scheduler client: %s", err)
	}

	_, nextRun := schedulerClient.NextRun()
	log.Printf("[INFO] Scheduler client started. Next run at %s", nextRun.Local())

	go http.NewServer(&http.ClientOptions{
		TwitchClient:         twitchClient,
		YouTubeService:       youtubeClient,
		ZimaClient:           zimaClient,
		YouTubeRepository:    youTubeRepository,
		UserActivity:         userActivity,
		UserHistory:          userHistory,
		UserWatchlist:        userWatchlist,
		ContentMultiProvider: contentMultiProvider,
		ESportMultiProvider:  esportMultiProvider,
		BaseStaticPath:       cfg.Http.BaseStaticPath,
		Port:                 cfg.Http.Port,
	}).Start(ctx, done)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	cancel()

	select {
	case <-done:
		log.Println("[INFO] Application shutdown completed")
	case <-time.After(15 * time.Second):
		log.Println("[INFO] Application shutdown timed out")
	}

	return nil
}
