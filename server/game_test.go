package main

import "testing"

func TestCreateGameRoom(t *testing.T) {
	room := NewRoom(make([]int, 0))
	if room.Id == "" {
		t.Fatalf("Needs id")
	}
}
