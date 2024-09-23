package content

import (
	"content-oracle/app/providers/esport"
	"log"
)

type ESportEvents struct {
	client *esport.Client
}

func NewESportEvents(client *esport.Client) *ESportEvents {
	return &ESportEvents{
		client,
	}
}

func (c *ESportEvents) GetAll() ([]esport.Match, error) {
	matches, err := c.client.GetMatches()
	if err != nil {
		log.Printf("[ERROR] failed to get esport matches: %s", err)
		return nil, err
	}

	return matches, nil
}
