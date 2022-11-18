package main

import (
	"os"
	"strconv"
	"sync"
)

var PROD_HOST = "https://whale-app-uecxk.ondigitalocean.app"

type Config struct {
	configOnce       sync.Once
	maxScore         int
	cardCount        int
	frontendHostName string
}

func NewConfig(env string, cardCount int) *Config {
	var frontendHostName = "http://localhost:3000"
	if env == "prod" {
		frontendHostName = PROD_HOST
	}
	return &Config{
		frontendHostName: frontendHostName,
		cardCount:        cardCount,
	}
}

func (c *Config) GetMaxScore() int {
	c.lazyInit()
	return c.maxScore
}

func (c *Config) lazyInit() {
	c.configOnce.Do(func() {
		c.maxScore = getIntFromEnv("GAME_MAX_SCORE", 30)
	})
}

func getIntFromEnv(envKey string, fallbackValue int) int {
	value, found := os.LookupEnv(envKey)
	if !found {
		return fallbackValue
	}

	parsedValue, err := strconv.Atoi(value)
	if err != nil {
		return fallbackValue
	}
	return parsedValue
}
