package main

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type playerConn struct {
	room     *Room
	player   *Player
	ws       *websocket.Conn
	mu       sync.Mutex
	lastPing time.Time
}

func (playerConn *playerConn) SendText(bytes []byte) {
	playerConn.mu.Lock()
	defer playerConn.mu.Unlock()
	if playerConn.ws != nil {
		playerConn.ws.WriteMessage(websocket.TextMessage, bytes)
	}
}

type Command struct {
	Type  string `json:"type"`
	Data  string `json:"data,omitempty"`
	Token string `json:"token,omitempty"`
}

func NewPlayerConn(ws *websocket.Conn, player *Player, room *Room) *playerConn {
	return &playerConn{room, player, ws, sync.Mutex{}, time.Now()}
}
