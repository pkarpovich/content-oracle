package providers

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
)

type Zima struct {
	url string
}

func NewZima(url string) *Zima {
	return &Zima{url: url}
}

type getContentActionArgs struct {
	ApplicationName string `json:"applicationName"`
	IncludePlayback bool   `json:"includePlayback"`
}

type getContentActionPayload struct {
	Name string               `json:"name"`
	Args getContentActionArgs `json:"args"`
}

type ZimaPlayback struct {
	ID        string `json:"id"`
	ContentID string `json:"contentId"`
	Position  string `json:"position"`
	UpdatedAt string `json:"updatedAt"`
}

type ZimaMetadata struct {
	ID         string `json:"id"`
	ContentID  string `json:"contentId"`
	ContentUrl string `json:"contentUrl"`
	PosterLink string `json:"posterLink"`
	VideoID    string `json:"videoId"`
}

type ZimaContent struct {
	ID          string         `json:"id"`
	Title       string         `json:"title"`
	Artist      string         `json:"artist"`
	Album       string         `json:"album"`
	Application string         `json:"application"`
	MediaType   string         `json:"mediaType"`
	CreatedAt   string         `json:"createdAt"`
	Playback    []ZimaPlayback `json:"playback"`
	Metadata    *ZimaMetadata  `json:"metadata"`
}

type invokeActionResponse struct {
	Message  string        `json:"message"`
	Response []ZimaContent `json:"response"`
}

func (c *Zima) GetContent(includePlayback bool, applicationName string) ([]ZimaContent, error) {
	reqPayload := getContentActionPayload{
		Name: "content-collector-history",
		Args: getContentActionArgs{
			IncludePlayback: includePlayback,
			ApplicationName: applicationName,
		},
	}

	resp, err := InvokeAction[invokeActionResponse, getContentActionPayload](c.url, reqPayload)
	if err != nil {
		return nil, err
	}

	return resp.Response, nil
}

type OpenUrlActionPayload struct {
	Name string `json:"name"`
	Args struct {
		Url string `json:"url"`
	} `json:"args"`
}

func (c *Zima) OpenUrl(url string) error {
	reqPayload := OpenUrlActionPayload{
		Name: "streams-start",
		Args: struct {
			Url string `json:"url"`
		}{url},
	}

	_, err := InvokeAction[interface{}, OpenUrlActionPayload](c.url, reqPayload)
	if err != nil {
		return err
	}

	return nil
}

func InvokeAction[T any, P any](url string, payload P) (*T, error) {
	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	invokeUrl := url + "/discovery/invoke"

	reader := bytes.NewReader(bodyBytes)
	resp, err := http.Post(invokeUrl, "application/json", reader)
	if err != nil {
		return nil, err
	}

	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("[ERROR] failed to close response body: %s", err)
		}
	}()

	var response T
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}

	return &response, nil
}
