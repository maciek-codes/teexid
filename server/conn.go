package main

import (
	"github.com/gorilla/websocket"
)

type playerConn struct {
	room   *Room
	player *Player
	ws     *websocket.Conn
}

type Command struct {
	Type  string `json:"type"`
	Data  string `json:"data,omitempty"`
	Token string `json:"token,omitempty"`
}

func NewPlayerConn(ws *websocket.Conn, player *Player, room *Room) playerConn {
	return playerConn{room, player, ws}
}
