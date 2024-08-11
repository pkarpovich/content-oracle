package http

import (
	"content-oracle/app/providers/twitch"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/rs/cors"
	"log"
	"net/http"
	"regexp"
	"time"
)

type Client struct {
	TwitchClient   *twitch.Client
	BaseStaticPath string
	Port           int
}

type ClientOptions struct {
	TwitchClient   *twitch.Client
	BaseStaticPath string
	Port           int
}

func NewClient(opt *ClientOptions) *Client {
	return &Client{
		BaseStaticPath: opt.BaseStaticPath,
		TwitchClient:   opt.TwitchClient,
		Port:           opt.Port,
	}
}

func (c *Client) Start(ctx context.Context, done chan struct{}) {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", c.healthHandler)
	mux.HandleFunc("GET /auth/twitch/callback", c.twitchAuthCallbackHandler)

	server := &http.Server{
		Addr: fmt.Sprintf(":%d", c.Port),
		Handler: cors.New(cors.Options{
			AllowedOrigins: []string{"*"},
			AllowedMethods: []string{"GET", "POST", "PATCH", "DELETE"},
		}).Handler(mux),
	}

	go func() {
		log.Printf("[INFO] Starting HTTP server on %s", server.Addr)
		if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
			log.Printf("[ERROR] HTTP server error: %v", err)
		}
		log.Printf("[INFO] HTTP server stopped")
	}()

	<-ctx.Done()

	shutdownCtx, shutdownRelease := context.WithTimeout(ctx, 10*time.Second)
	defer shutdownRelease()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("[ERROR] HTTP server error: %v", err)
	}
	log.Printf("[INFO] HTTP server shutdown")

	close(done)
}

type HealthResponse struct {
	Message string `json:"message"`
}

func (c *Client) healthHandler(w http.ResponseWriter, r *http.Request) {
	err := json.NewEncoder(w).Encode(HealthResponse{
		Message: "OK",
	})
	if err != nil {
		log.Printf("[ERROR] failed to encode health response: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *Client) twitchAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "code not found", http.StatusBadRequest)
		return
	}

	token, err := c.TwitchClient.GetAuthToken(code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("[INFO] token: %s", token)
	resp, err := c.TwitchClient.GetLiveStreams()
	if err != nil {
		log.Printf("[ERROR] failed to get live streams: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	log.Printf("[INFO] live streams: %v", resp.Data)

	err = json.NewEncoder(w).Encode(token)
	if err != nil {
		log.Printf("[ERROR] failed to encode token response: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *Client) fileHandler(w http.ResponseWriter, r *http.Request) {
	fileMatcher := regexp.MustCompile(`^/.*\..+$`)
	if fileMatcher.MatchString(r.URL.Path) {
		http.ServeFile(w, r, fmt.Sprintf("%s/%s", c.BaseStaticPath, r.URL.Path[1:]))
		return
	}

	http.ServeFile(w, r, fmt.Sprintf("%s/%s", c.BaseStaticPath, "index.html"))
}
