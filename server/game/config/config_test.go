package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfigMaxScoreLazyInit(t *testing.T) {
	assert := assert.New(t)

	cfg := Config{}
	t.Setenv("GAME_MAX_SCORE", "10")
	assert.Equal(0, cfg.maxScore)
	assert.Equal(10, cfg.GetMaxScore())
	assert.Equal(10, cfg.maxScore)
}

func TestInit(t *testing.T) {
	assert := assert.New(t)

	cfg := Config{}
	InitConfig("foobar:3000", 123, 42)
	assert.Equal(0, cfg.AllowedOrigin)
	assert.Equal(10, cfg.CardCount)
	assert.Equal(10, cfg)
}
