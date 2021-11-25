package main

import "github.com/gorilla/websocket"

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
			break
		}

		pc.room.UpdateState(pc.player, payload)
	}

	pc.ws.Close()
}

func NewPlayerConn(ws *websocket.Conn, player *Player, room *Room) playerConn {
	playerConn := playerConn{room, player, ws}
	return playerConn
}
