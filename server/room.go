package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/gorilla/websocket"
)

type RoomState int32

var randGenSource = rand.NewSource(time.Now().UnixNano())
var randGen = rand.New(randGenSource)

var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func randSeq(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[randGen.Intn(len(letters))]
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
	players []*Player
	conns   map[string]playerConn
}

func NewRoom() *Room {
	id := randSeq(10)
	room := Room{Id: id, State: WaitingForPlayers,
		players: make([]*Player, 0),
		conns:   make(map[string]playerConn, 0),
	}
	go room.run()
	return &room
}

func (r *Room) CanJoin() bool {
	return r.State == WaitingForPlayers
}

func (r *Room) run() {
	log.Println("Running the room " + r.Id)
}

func (r *Room) Players() []*Player {
	return r.players[0:len(r.players)]
}

func (r *Room) BroadcastPlayers() {
	b, _ := json.Marshal(r.players)
	message := fmt.Sprintf("{\"type\": \"onplayersupdated\", \"payload\":{\"players\": %s}}", string(b))

	for _, playerConn := range r.conns {
		playerConn.ws.WriteMessage(websocket.TextMessage, []byte(message))
	}
}

func (r *Room) AddPlayer(p *Player, conn *websocket.Conn) playerConn {
	r.players = append(r.players, p)
	r.conns[p.Id()] = NewPlayerConn(conn, p, r)
	r.BroadcastPlayers()
	return r.conns[p.Id()]
}

func (r *Room) UpdateState(p *Player, command Command) {
	if command.Type == "player/updateName" {
		var newName = command.Data
		p.SetName(newName)
		r.BroadcastPlayers()
	}
}
