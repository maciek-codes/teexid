package main

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestCreateGameRoom(t *testing.T) {
	room := NewRoom(make([]int, 0), uuid.UUID{}, "test-1")
	assert.Equal(t, "test-1", room.Id)
	if room.Id == "" {
		t.Fatalf("Needs id")
	}
}
