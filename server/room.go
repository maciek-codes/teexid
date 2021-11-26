package main

import (
	"log"

	"github.com/google/uuid"
)

type RoomState int32

const (
	WaitingForPlayers RoomState = 0
	PlayingGame                 = 1
	Ended                       = 2
)

type GameRoom interface {
	GetId() string
	CanJoin() bool
}

type Room struct {
	Id      string    `json:"id"`
	State   RoomState `json:"state,omitempty"`
	players []Player
}

func NewRoom() *Room {
	id := uuid.NewString()
	return &Room{Id: id, State: WaitingForPlayers, players: make([]Player, 0)}
}

func (r *Room) CanJoin() bool {
	return r.State == WaitingForPlayers
}

func (r *Room) Players() []Player {
	return r.players[0:len(r.players)]
}

func (r *Room) AddPlayer(p *Player) {
	r.players = append(r.players, *p)
}

func (r *Room) UpdateState(p *Player, payload []byte) {
	log.Print(p.Name())
	log.Println(payload)
}
