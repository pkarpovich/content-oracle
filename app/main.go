package main

import (
	"content-oracle/app/config"
	"content-oracle/app/content"
	"content-oracle/app/database"
	"content-oracle/app/http"
	"content-oracle/app/providers/twitch"
	"content-oracle/app/providers/zima"
	"content-oracle/app/store/settings"
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

	db, err := database.NewClient("content-oracle.db")
	if err != nil {
		log.Printf("[ERROR] Error creating database client: %s", err)
		return err
	}

	settingsRepository, err := settings.NewRepository(db)
	if err != nil {
		log.Printf("[ERROR] Error creating settings repository: %s", err)
		return err
	}

	twitchClient, err := twitch.NewClient(&twitch.ClientOptions{
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

	zimaClient := zima.NewClient(cfg.Zima.Url)

	contentService := content.NewClient(&content.ClientOptions{
		TwitchClient: twitchClient,
		ZimaClient:   zimaClient,
	})

	go http.NewClient(&http.ClientOptions{
		ContentService: contentService,
		TwitchClient:   twitchClient,
		BaseStaticPath: cfg.Http.BaseStaticPath,
		Port:           cfg.Http.Port,
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
