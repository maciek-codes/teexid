package game

import (
	"testing"

	"github.com/google/uuid"
	"github.com/macqm/teexid/game/room"
	"github.com/stretchr/testify/assert"
)

func TestCreateGameRoom(t *testing.T) {
	r := room.NewRoom(make([]int, 0), uuid.UUID{}, "test-1")
	assert.Equal(t, "test-1", r.Id)
	if r.Id == "" {
		t.Fatalf("Needs id")
	}
}
