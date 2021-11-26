package main

import "testing"

func TestCreateGameRoom(t *testing.T) {
	room := NewRoom()
	if room.Id == "" {
		t.Fatalf("Needs id")
	}
}
