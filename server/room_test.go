package main

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCanJoin(t *testing.T) {
	assert := assert.New(t)

	room := NewRoom()
	assert.Equal(WaitingForPlayers, room.State)

	// Start playing
	room.State = PlayingGame
	assert.False(room.CanJoin())

	// Allow to join again
	room.State = WaitingForPlayers
	assert.True((room.CanJoin()))
}

func TestRoomHasPlayers(t *testing.T) {
	assert := assert.New(t)

	room := NewRoom()
	assert.Len(room.Players(), 0)

	p1 := NewPlayer("Alice")
	p2 := NewPlayer("Bob")
	room.AddPlayer(p1, nil)
	room.AddPlayer(p2, nil)

	assert.Len(room.Players(), 2)
}

func TestMarshalToJson(t *testing.T) {
	assert := assert.New(t)

	room := NewRoom()
	room.Id = "bcd"
	b, err := json.Marshal(room)
	assert.Nil(err)
	assert.NotEmpty(b)
	assert.Equal("{\"id\":\"bcd\"}", string(b))
}
