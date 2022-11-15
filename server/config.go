package main

import (
	"os"
	"strconv"
	"sync"
)

type Config struct {
	configOnce sync.Once
	maxScore   int
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
