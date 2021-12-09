package main

import (
	"encoding/json"

	"github.com/google/uuid"
)

type Player struct {
	id   uuid.UUID
	name string
}

func NewPlayer(name string) *Player {
	player := Player{id: uuid.New(), name: name}
	return &player
}

func (p *Player) Name() string {
	return p.name
}

func (p *Player) SetName(newName string) {
	p.name = newName
}

func (p *Player) Id() string {
	return p.id.String()
}

func (p *Player) MarshalJSON() ([]byte, error) {
	return json.Marshal(p.Name())
}
