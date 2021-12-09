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
	Type string
	Data string
}

// Recieve messages from that player in a coroutine
func (pc *playerConn) receiveMessages() {
	for {
		if pc.ws == nil {
			break
		}
		_, payload, err := pc.ws.ReadMessage()
		if err != nil {
			log.Printf("Error on ReadMessage: %s", err.Error())
			break
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
	playerConn := playerConn{room, player, ws}

	// Add player to the room
	go playerConn.receiveMessages()
	return playerConn
}
