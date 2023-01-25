package room

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/macqm/teexid/game/player"
)

type PlayerConn struct {
	Player   *player.Player
	ws       *websocket.Conn
	mu       sync.Mutex
	lastPing time.Time
}

func (playerConn *PlayerConn) SendText(bytes []byte) {
	playerConn.mu.Lock()
	defer playerConn.mu.Unlock()
	if playerConn.ws != nil {
		playerConn.ws.WriteMessage(websocket.TextMessage, bytes)
	}
}

type Command struct {
	Type string `json:"type"`
}

func NewPlayerConn(ws *websocket.Conn, player *player.Player) *PlayerConn {
	return &PlayerConn{
		Player:   player,
		ws:       ws,
		mu:       sync.Mutex{},
		lastPing: time.Now(),
	}
}

func (pconn *PlayerConn) ReceiveMessages(p *player.Player, r *Room) {
	// Recieve messages from that connection in a coroutine
	for {
		if pconn.ws == nil {
			break
		}
		_, payload, err := pconn.ws.ReadMessage()
		if err != nil {
			log.Printf("%s disconnected from %s", pconn.Player.Name, r.Id)
			break
		}

		var command Command
		err = json.Unmarshal(payload, &command)
		if err != nil {
			log.Printf("Unknown message: %s", err.Error())
			continue
		}
		handleCommandFromClient(pconn, r, &command)
	}

	if pconn.ws != nil {
		pconn.ws.Close()
	}
}

func handleCommandFromClient(pconn *PlayerConn, room *Room, command *Command) {
	if command.Type == "ping" {
		// Update user's last ping time
		pconn.lastPing = time.Now()
		message := ReponseMessage{Type: "pong"}
		b, _ := json.Marshal(message)
		pconn.ws.WriteMessage(websocket.TextMessage, b)
	}
}
