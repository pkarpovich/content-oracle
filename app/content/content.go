package content

import (
	"content-oracle/app/providers/esport"
	"context"
	"github.com/go-pkgz/syncs"
	"log"
)

const MaxSuggestions = 20

type Artist struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Content struct {
	ID          string  `json:"id"`
	Artist      Artist  `json:"artist"`
	Title       string  `json:"title"`
	Thumbnail   string  `json:"thumbnail"`
	Url         string  `json:"url"`
	IsLive      bool    `json:"isLive"`
	Position    float64 `json:"position"`
	Category    string  `json:"category"`
	PublishedAt string  `json:"publishedAt"`
}

type Provider interface {
	GetAll() ([]Content, error)
}

type MultiProvider []Provider

func (mp MultiProvider) GetAll() ([]Content, error) {
	wg := syncs.NewSizedGroup(4)

	var allContent []Content

	for _, provider := range mp {
		wg.Go(func(ctx context.Context) {
			content, err := provider.GetAll()
			if err != nil {
				log.Printf("[ERROR] failed to get content from provider: %s", err)
				return
			}

			allContent = append(allContent, content...)
		})
	}

	wg.Wait()

	return allContent, nil
}

type ESportProvider interface {
	GetAll() ([]esport.Match, error)
}

type MultiESportProvider []ESportProvider

func (mp MultiESportProvider) GetAll() ([]esport.Match, error) {
	wg := syncs.NewSizedGroup(4)

	var allMatches []esport.Match

	for _, provider := range mp {
		wg.Go(func(ctx context.Context) {
			matches, err := provider.GetAll()
			if err != nil {
				log.Printf("[ERROR] failed to get matches from provider: %s", err)
				return
			}

			allMatches = append(allMatches, matches...)
		})
	}

	wg.Wait()

	return allMatches, nil
}
