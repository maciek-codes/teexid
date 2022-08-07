package main

import (
	"testing"

	"github.com/google/uuid"
)

func TestCreateGameRoom(t *testing.T) {
	room := NewRoom(make([]int, 0), uuid.UUID{})
	if room.Id == "" {
		t.Fatalf("Needs id")
	}
}
