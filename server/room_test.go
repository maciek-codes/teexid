package main

import (
	"encoding/json"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestCanJoin(t *testing.T) {
	assert := assert.New(t)

	room := NewRoom(make([]int, 0), uuid.UUID{})
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

	p1 := NewPlayer("Alice", uuid.UUID{})

	room := NewRoom(make([]int, 0), p1.Id)
	assert.Len(room.Players(), 0)

	p2 := NewPlayer("Bob", uuid.UUID{})
	room.AddPlayer(p1, nil)
	room.AddPlayer(p2, nil)

	assert.Len(room.Players(), 2)
}

func TestMarshalToJson(t *testing.T) {
	assert := assert.New(t)

	room := NewRoom(make([]int, 0), uuid.UUID{})
	room.Id = "bcd"
	b, err := json.Marshal(room)
	assert.Nil(err)
	assert.NotEmpty(b)
	assert.Contains(string(b), `"id":"bcd"`)
	assert.Contains(string(b), `"ownerId"`)
}
