package main

import (
	"log"
	"math/rand"
)

type RoomState int32

var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func randSeq(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

const (
	WaitingForPlayers RoomState = iota
	PlayingGame
	Ended
)

type GameRoom interface {
	GetId() string
	CanJoin() bool
}

type Room struct {
	Id      string    `json:"id"`
	State   RoomState `json:"state,omitempty"`
	players []Player
	conns   map[string]playerConn
}

func NewRoom() *Room {
	id := randSeq(10)
	room := Room{Id: id, State: WaitingForPlayers, players: make([]Player, 0)}
	go room.run()
	return &room
}

func (r *Room) CanJoin() bool {
	return r.State == WaitingForPlayers
}

func (r *Room) run() {

}

func (r *Room) Players() []Player {
	return r.players[0:len(r.players)]
}

func (r *Room) AddPlayer(p *Player) {
	r.players = append(r.players, *p)
	r.conns[p.Id()] = NewPlayerConn(nil, p, r)
}

func (r *Room) UpdateState(p *Player, payload []byte) {
	log.Print(p.Name())
	log.Println(payload)
}
