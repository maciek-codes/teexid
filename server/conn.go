package main

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

type playerConn struct {
	room   *Room
	player *Player
	ws     *websocket.Conn
}

type Command struct {
	Type string `json:"type"`
	Data string `json:"data,omitempty"`
}

// Recieve messages from that player in a coroutine
func (pc *playerConn) receiveMessages() {
	for {
		if pc.ws == nil {
			break
		}
		_, payload, err := pc.ws.ReadMessage()
		if err != nil {
			// TODO use ping/pong to detect real disconnect
			log.Printf("Disconnected: %s", pc.player.Name)
			if pc.ws != nil {
				pc.ws.Close()
			}
			// We may want to mark as inactive
			pc.room.RemovePlayer(pc.player)
			return
		}

		var command Command
		err = json.Unmarshal(payload, &command)
		if err != nil {
			log.Printf("Unknown message: %s", err.Error())
			continue
		}

		pc.room.UpdateState(pc.player, command)
	}

	if pc.ws != nil {
		pc.ws.Close()
	}
}

func NewPlayerConn(ws *websocket.Conn, player *Player, room *Room) playerConn {
	return playerConn{room, player, ws}
}
