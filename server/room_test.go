package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCanJoin(t *testing.T) {
	assert := assert.New(t)

	room := NewRoom()
	assert.Equal(WaitingForPlayers, room.state)

	// Start playing
	room.state = PlayingGame
	assert.False(room.CanJoin())

	// Allow to join again
	room.state = WaitingForPlayers
	assert.True((room.CanJoin()))
}

func TestRoomHasPlayers(t *testing.T) {
	assert := assert.New(t)

	room := NewRoom()
	assert.Len(room.Players(), 0)

	p1 := NewPlayer("Alice")
	p2 := NewPlayer("Bob")
	room.AddPlayer(p1)
	room.AddPlayer(p2)

	assert.Len(room.Players(), 2)
}
