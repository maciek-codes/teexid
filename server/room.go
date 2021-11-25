package main

import "github.com/google/uuid"

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
	id      string
	state   RoomState
	players []Player
}

func NewRoom() *Room {
	id := uuid.NewString()
	r := Room{id: id, state: WaitingForPlayers, players: make([]Player, 0)}
	return &r
}

func (r *Room) Id() string {
	return r.id
}

func (r *Room) CanJoin() bool {
	return r.state == WaitingForPlayers
}

func (r *Room) Players() []Player {
	return r.players[0:len(r.players)]
}

func (r *Room) AddPlayer(p *Player) {
	r.players = append(r.players, *p)
}
