package config

import (
	"github.com/ilyakaznacheev/cleanenv"
	"github.com/joho/godotenv"
	"log"
)

type TwitchConfig struct {
	ClientID     string `env:"TWITCH_CLIENT_ID"`
	ClientSecret string `env:"TWITCH_CLIENT_SECRET"`
	RedirectURI  string `env:"TWITCH_REDIRECT_URI"`
	UserId       string `env:"TWITCH_USER_ID"`
}

type YoutubeConfig struct {
	ClientID     string `env:"YOUTUBE_CLIENT_ID"`
	ClientSecret string `env:"YOUTUBE_CLIENT_SECRET"`
	RedirectURI  string `env:"YOUTUBE_REDIRECT_URI"`
	ConfigPath   string `env:"YOUTUBE_CONFIG_PATH"`
}

type HttpConfig struct {
	Port           int    `env:"HTTP_PORT" env-default:"8080"`
	BaseStaticPath string `env:"BASE_STATIC_PATH" env-default:"frontend/dist"`
	BaseUrl        string `env:"BASE_URL" env-default:"http://localhost:8080"`
}

type ZimaConfig struct {
	Url string `env:"ZIMA_URL"`
}

type EsportConfig struct {
	ApiKey  string   `env:"ESPORT_API_KEY"`
	BaseUrl string   `env:"ESPORT_BASE_URL"`
	Teams   []string `env:"ESPORT_TEAMS" env-separator:","`
}

type Config struct {
	Twitch  TwitchConfig
	Http    HttpConfig
	Zima    ZimaConfig
	Youtube YoutubeConfig
	Esport  EsportConfig
}

func Init() (*Config, error) {
	err := godotenv.Load()
	if err != nil {
		log.Printf("[WARN] error while loading .env file: %v", err)
	}

	var cfg Config
	err = cleanenv.ReadEnv(&cfg)
	if err != nil {
		return nil, err
	}

	return &cfg, nil
}
