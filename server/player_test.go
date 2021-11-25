package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCanChangeName(t *testing.T) {
	assert := assert.New(t)

	player := NewPlayer("Jane")
	assert.Equal("Jane", player.Name())
	id := player.Id()
	assert.NotEqual("00000000-0000-0000-0000-000000000000", player.Id())

	player.SetName("Jane D.")
	assert.Equal("Jane D.", player.Name())
	assert.Equal(id, player.Id())
}
