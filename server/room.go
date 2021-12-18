package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"time"

	"github.com/gorilla/websocket"
)

const MinPlayers = 3

var randGenSource = rand.NewSource(time.Now().UnixNano())
var randGen = rand.New(randGenSource)

var letters = []rune("abcdefghijklmnopqrstuvwxyz")

func randSeq(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[randGen.Intn(len(letters))]
	}
	return string(b)
}

type GameRoom interface {
	GetId() string
	CanJoin() bool
}

type Room struct {
	Id      string    `json:"id"`
	State   RoomState `json:"state,omitempty"`
	OwnerId string    `json:"ownerId"`
	players []*Player
	conns   map[string]playerConn
}

type ReponseMessage struct {
	Type    string           `json:"type"`
	Payload *json.RawMessage `json:"payload"`
}

func NewRoom() *Room {
	id := randSeq(6)
	room := Room{Id: id,
		State:   WaitingForPlayers,
		players: make([]*Player, 0),
		conns:   make(map[string]playerConn, 0),
	}
	return &room
}

func (r *Room) CanJoin() bool {
	return r.State == WaitingForPlayers
}

func (r *Room) Players() []*Player {
	return r.players[0:len(r.players)]
}

func (r *Room) BroadcastPlayers() {
	b, _ := json.Marshal(struct {
		Players []*Player `json:"players"`
	}{Players: r.players})

	playersMessage := json.RawMessage(b)

	message := ReponseMessage{
		Type:    "onplayersupdated",
		Payload: &playersMessage}

	b, err := json.Marshal(&message)
	if err != nil {
		log.Println("Error marshalling", err)
		return
	}

	log.Printf("Writing %s\n", string(b))

	for _, playerConn := range r.conns {
		if playerConn.ws != nil {
			playerConn.ws.WriteMessage(websocket.TextMessage, b)
		}
	}
}

// Send room status change to all players
func (r *Room) BroadcastRoomState() {
	b, _ := json.Marshal(struct {
		Id        string    `json:"id"`
		RoomState RoomState `json:"state"`
	}{Id: r.Id, RoomState: r.State})

	payloadMessage := json.RawMessage(b)

	message := ReponseMessage{
		Type:    "onroomstateupdated",
		Payload: &payloadMessage}

	b, err := json.Marshal(&message)
	if err != nil {
		log.Println("Error marshalling", err)
		return
	}

	log.Printf("Writing %s\n", string(b))

	for _, playerConn := range r.conns {
		playerConn.ws.WriteMessage(websocket.TextMessage, b)
	}
}

func (r *Room) AddPlayer(p *Player, conn *websocket.Conn) playerConn {
	r.players = append(r.players, p)
	r.conns[p.IdAsString()] = NewPlayerConn(conn, p, r)
	r.BroadcastPlayers()
	return r.conns[p.IdAsString()]
}

func (r *Room) UpdateState(p *Player, command Command) {
	if command.Type == "player/updateName" {
		var newName = command.Data
		p.SetName(newName)
		r.BroadcastPlayers()
	} else if command.Type == "player/ready" {
		p.SetReady()
		r.BroadcastPlayers()
		var allReady = true
		for _, player := range r.Players() {
			allReady = allReady && player.IsReady()
		}
		if allReady && len(r.Players()) >= MinPlayers {
			r.State = PlayingGame
			r.BroadcastRoomState()
		}
	}
}
