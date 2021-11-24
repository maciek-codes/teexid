package main

import "testing"

func TestCreateGameRoom(t *testing.T) {
	room := NewRoom()
	if room.id == "" {
		t.Fatalf("Needs id")
	}
}
