package main

import (
	"github.com/google/uuid"
)

type PlayerReadyState int32

const (
	Waiting PlayerReadyState = iota
	Ready
)

type Player struct {
	Id         uuid.UUID        `json:"id"`
	Name       string           `json:"name"`
	ReadyState PlayerReadyState `json:"-"`
	Ready      bool             `json:"ready"`
	Points     int32            `json:"points"`
}

func NewPlayer(name string) *Player {
	return &Player{
		Id:         uuid.New(),
		Name:       name,
		ReadyState: Waiting,
		Points:     0}
}

func (p *Player) SetName(newName string) {
	p.Name = newName
}

func (p *Player) SetReady() {
	p.ReadyState = Ready
	p.Ready = true
}

func (p *Player) IsReady() bool {
	return p.ReadyState == Ready
}

func (p *Player) IdAsString() string {
	return p.Id.String()
}
