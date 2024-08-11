package main

import (
	"content-oracle/app/config"
	"content-oracle/app/http"
	"content-oracle/app/providers/twitch"
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

	twitchClient, err := twitch.NewClient(&twitch.ClientOptions{
		RedirectURI:  cfg.Twitch.RedirectURI,
		ClientID:     cfg.Twitch.ClientID,
		ClientSecret: cfg.Twitch.ClientSecret,
		UserId:       cfg.Twitch.UserId,
	})
	if err != nil {
		log.Printf("[ERROR] Error creating Twitch client: %s", err)
		return err
	}

	go http.NewClient(&http.ClientOptions{
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
