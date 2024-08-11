package twitch

import (
	"github.com/nicklaw5/helix/v2"
	"log"
)

type Client struct {
	helix  *helix.Client
	userId string
}

type ClientOptions struct {
	RedirectURI  string
	ClientSecret string
	ClientID     string
	UserId       string
}

func NewClient(opt *ClientOptions) (*Client, error) {
	client, err := helix.NewClient(&helix.Options{
		RedirectURI:  opt.RedirectURI,
		ClientID:     opt.ClientID,
		ClientSecret: opt.ClientSecret,
	})
	if err != nil {
		return nil, err
	}

	url := client.GetAuthorizationURL(&helix.AuthorizationURLParams{
		ResponseType: "code",
		Scopes:       []string{"user:read:follows"},
	})
	log.Printf("Authorization URL: %s", url)

	return &Client{
		userId: opt.UserId,
		helix:  client,
	}, nil
}

func (c *Client) GetLiveStreams() (*helix.StreamsResponse, error) {
	resp, err := c.helix.GetFollowedStream(&helix.FollowedStreamsParams{
		UserID: c.userId,
	})
	if err != nil {
		return nil, err
	}

	return resp, nil
}

func (c *Client) GetAuthToken(code string) (string, error) {
	resp, err := c.helix.RequestUserAccessToken(code)
	if err != nil {
		return "", err
	}

	c.helix.SetUserAccessToken(resp.Data.AccessToken)
	c.helix.SetRefreshToken(resp.Data.RefreshToken)

	return resp.Data.AccessToken, nil
}
