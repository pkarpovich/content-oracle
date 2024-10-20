package content

import (
	"content-oracle/app/providers"
	"log"
)

type ESportEvents struct {
	client *providers.ESport
}

func NewESportEvents(client *providers.ESport) *ESportEvents {
	return &ESportEvents{
		client,
	}
}

func (c *ESportEvents) GetAll() ([]providers.ESportMatch, error) {
	matches, err := c.client.GetMatches()
	if err != nil {
		log.Printf("[ERROR] failed to get esport matches: %s", err)
		return nil, err
	}

	return matches, nil
}
