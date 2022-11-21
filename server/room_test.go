package main

import (
	"encoding/json"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestCanJoin(t *testing.T) {
	assert := assert.New(t)

	room := NewRoom(make([]int, 0), uuid.UUID{}, "foobar")
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

	p1 := NewPlayer("Alice", uuid.New())

	room := NewRoom(make([]int, 0), p1.Id, "room-1")
	assert.Len(room.Players(), 0)

	p2 := NewPlayer("Bob", uuid.New())
	room.AddPlayer(p1, nil)
	room.AddPlayer(p2, nil)

	assert.Len(room.Players(), 2)
}

func TestMarshalToJson(t *testing.T) {
	assert := assert.New(t)

	room := NewRoom(make([]int, 0), uuid.UUID{}, "bcd")
	b, err := json.Marshal(room)
	assert.Nil(err)
	assert.NotEmpty(b)
	assert.Contains(string(b), `"id":"bcd"`)
	assert.Contains(string(b), `"ownerId"`)
}

func TestDealCards(t *testing.T) {

	assert := assert.New(t)

	p1 := NewPlayer("Alice", uuid.New())

	room := NewRoom(make([]int, 0), p1.Id, "room-1")
	assert.Len(room.Players(), 0)

	p2 := NewPlayer("Bob", uuid.New())
	room.AddPlayer(p1, nil)
	room.AddPlayer(p2, nil)

	assert.Len(room.Players(), 2)

	room.cardIds = append(room.cardIds, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)

	room.sendCardsToEach(2)
	assert.Equal(len(p1.Cards), 2)
	assert.Equal(len(p2.Cards), 2)

	room.sendCardsToEach(1)
	assert.Equal(len(p1.Cards), 3)
	assert.Equal(len(p2.Cards), 3)

	room.sendCardsToEach(3)
	assert.Equal(len(p1.Cards), 6)
	assert.Equal(len(p2.Cards), 5)

	room.sendCardsToEach(3)
	assert.Equal(len(p1.Cards), 6)
	assert.Equal(len(p2.Cards), 5)

}
