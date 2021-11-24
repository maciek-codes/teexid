package main

import "github.com/google/uuid"

type GameRoom interface {
	GetId() string
}

type Room struct {
	id string
}

func NewRoom() *Room {
	id := uuid.NewString()
	r := Room{id: id}
	return &r
}
func (r *Room) GetId() string {
	return r.id
}
