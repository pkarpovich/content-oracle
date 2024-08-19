package zima

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
)

type Client struct {
	url string
}

func NewClient(url string) *Client {
	return &Client{url: url}
}

type GetContentActionArgs struct {
	ApplicationName string `json:"applicationName"`
}

type GetContentActionPayload struct {
	Name string               `json:"name"`
	Args GetContentActionArgs `json:"args"`
}

type Playback struct {
	ID        string `json:"id"`
	ContentID string `json:"contentId"`
	Position  string `json:"position"`
	UpdatedAt string `json:"updatedAt"`
}

type Metadata struct {
	ID         string `json:"id"`
	ContentID  string `json:"contentId"`
	ContentUrl string `json:"contentUrl"`
	PosterLink string `json:"posterLink"`
	VideoID    string `json:"videoId"`
}

type Content struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Artist      string     `json:"artist"`
	Album       string     `json:"album"`
	Application string     `json:"application"`
	MediaType   string     `json:"mediaType"`
	CreatedAt   string     `json:"createdAt"`
	Playback    []Playback `json:"playback"`
	Metadata    *Metadata  `json:"metadata"`
}

type InvokeActionResponse struct {
	Message  string    `json:"message"`
	Response []Content `json:"response"`
}

func (c *Client) GetContent() ([]Content, error) {
	reqPayload := GetContentActionPayload{
		Name: "content-collector-history",
		Args: GetContentActionArgs{
			ApplicationName: "YouTube (com.google.ios.youtube)",
		},
	}

	resp, err := InvokeAction[InvokeActionResponse, GetContentActionPayload](c.url, reqPayload)
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

func (c *Client) OpenUrl(url string) error {
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
