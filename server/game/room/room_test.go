package room

import (
	"encoding/json"
	"testing"

	"github.com/google/uuid"
	"github.com/macqm/teexid/game/player"
	"github.com/stretchr/testify/assert"
)

func TestRoomHasPlayers(t *testing.T) {
	assert := assert.New(t)

	p1 := player.NewPlayer("Alice", uuid.New())

	r := NewRoom(make([]int, 0), p1.Id, "room-1")
	assert.Len(r.Players(), 0)

	p2 := player.NewPlayer("Bob", uuid.New())
	r.AddPlayer(p1)
	r.AddPlayer(p2)

	assert.Len(r.Players(), 2)
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

	p1 := player.NewPlayer("Alice", uuid.New())

	room := NewRoom(make([]int, 0), p1.Id, "room-1")
	assert.Len(room.Players(), 0)

	p2 := player.NewPlayer("Bob", uuid.New())
	room.AddPlayer(p1)
	room.AddPlayer(p2)

	assert.Len(room.Players(), 2)

	room.cardIds = append(room.cardIds, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)

	room.sendCardsToEach(2)
	assert.Equal(2, len(p1.Cards))
	assert.Equal(2, len(p2.Cards))

	room.sendCardsToEach(1)
	assert.Equal(3, len(p1.Cards))
	assert.Equal(3, len(p2.Cards))

	room.sendCardsToEach(3)
	assert.Equal(6, len(p1.Cards))
	assert.Equal(5, len(p2.Cards))

	room.sendCardsToEach(3)
	assert.Equal(6, len(p1.Cards))
	assert.Equal(5, len(p2.Cards))

}
