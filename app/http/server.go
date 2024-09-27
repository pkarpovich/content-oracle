package http

import (
	"content-oracle/app/content"
	"content-oracle/app/database"
	"content-oracle/app/providers/twitch"
	"content-oracle/app/providers/youtube"
	"content-oracle/app/providers/zima"
	"content-oracle/app/user"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/rs/cors"
	"io"
	"log"
	"net/http"
	"regexp"
	"time"
)

type Server struct {
	TwitchClient         *twitch.Client
	ZimaClient           *zima.Client
	YouTubeService       *youtube.Client
	YouTubeRepository    *database.YouTubeRepository
	UserActivity         *user.Activity
	UserHistory          *user.History
	BaseStaticPath       string
	Port                 int
	ContentMultiProvider content.MultiProvider
	ESportMultiProvider  content.MultiESportProvider
}

type ClientOptions struct {
	TwitchClient         *twitch.Client
	YouTubeService       *youtube.Client
	ZimaClient           *zima.Client
	YouTubeRepository    *database.YouTubeRepository
	UserActivity         *user.Activity
	UserHistory          *user.History
	ContentMultiProvider content.MultiProvider
	ESportMultiProvider  content.MultiESportProvider
	BaseStaticPath       string
	Port                 int
}

func NewServer(opt *ClientOptions) *Server {
	return &Server{
		YouTubeService:       opt.YouTubeService,
		TwitchClient:         opt.TwitchClient,
		ZimaClient:           opt.ZimaClient,
		YouTubeRepository:    opt.YouTubeRepository,
		UserActivity:         opt.UserActivity,
		UserHistory:          opt.UserHistory,
		ContentMultiProvider: opt.ContentMultiProvider,
		ESportMultiProvider:  opt.ESportMultiProvider,
		BaseStaticPath:       opt.BaseStaticPath,
		Port:                 opt.Port,
	}
}

func (c *Server) Start(ctx context.Context, done chan struct{}) {
	mux := http.NewServeMux()
	mux = c.routes(mux)

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

func (c *Server) routes(router *http.ServeMux) *http.ServeMux {
	router.HandleFunc("GET /auth/twitch/callback", c.twitchAuthCallbackHandler)
	router.HandleFunc("GET /auth/youtube/callback", c.youtubeAuthCallbackHandler)

	router.HandleFunc("GET /api/content", c.getAllContentHandler)
	router.HandleFunc("POST /api/content/open", c.openContentHandler)

	router.HandleFunc("POST /api/activity", c.createActivityHandler)

	router.HandleFunc("GET /api/settings", c.getSettingsHandler)
	router.HandleFunc("POST /api/settings", c.saveSettingsHandler)
	router.HandleFunc("DELETE /api/settings", c.cleanSettingsHandler)
	router.HandleFunc("POST /api/settings/subscriptions", c.initChannelsHandler)

	router.HandleFunc("GET /api/history", c.getHistoryHandler)

	router.HandleFunc("GET /api/health", c.healthHandler)
	router.HandleFunc("GET /api/proxy", c.proxyHandler)
	router.HandleFunc("GET /", c.fileHandler)

	return router
}

type HealthResponse struct {
	Message string `json:"message"`
}

func (c *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	err := json.NewEncoder(w).Encode(HealthResponse{
		Message: "OK",
	})
	if err != nil {
		log.Printf("[ERROR] failed to encode health response: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *Server) proxyHandler(w http.ResponseWriter, r *http.Request) {
	imageUrl := r.URL.Query().Get("url")
	if imageUrl == "" {
		http.Error(w, "url not found", http.StatusBadRequest)
		return
	}

	resp, err := http.Get(imageUrl)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("[ERROR] failed to close response body: %s", err)
		}
	}()

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		log.Printf("[ERROR] failed to copy response body: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *Server) fileHandler(w http.ResponseWriter, r *http.Request) {
	fileMatcher := regexp.MustCompile(`^/.*\..+$`)
	if fileMatcher.MatchString(r.URL.Path) {
		http.ServeFile(w, r, fmt.Sprintf("%s/%s", c.BaseStaticPath, r.URL.Path[1:]))
		return
	}

	http.ServeFile(w, r, fmt.Sprintf("%s/%s", c.BaseStaticPath, "index.html"))
}
