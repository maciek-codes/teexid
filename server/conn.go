package main

import (
	"log"

	"github.com/gorilla/websocket"
)

type playerConn struct {
	room   *Room
	player *Player
	ws     *websocket.Conn
}

// Recieve messages from that player in a coroutine
func (pc *playerConn) receiveMessages() {
	for {
		_, payload, err := pc.ws.ReadMessage()
		if err != nil {
			log.Printf("Error on ReadMessage: %s", err.Error())
			break
		}

		pc.room.UpdateState(pc.player, payload)
	}

	pc.ws.Close()
}

func NewPlayerConn(ws *websocket.Conn, player *Player, room *Room) playerConn {
	playerConn := playerConn{room, player, ws}
	go playerConn.receiveMessages()
	return playerConn
}
