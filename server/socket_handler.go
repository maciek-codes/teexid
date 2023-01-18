package main

import (
	"log"
	"net/http"
)

func startSocket(w http.ResponseWriter, req *http.Request) {
	queryValues := req.URL.Query()

	tokenStr := queryValues.Get("token")

	token, err := ParseJwt(tokenStr)
	if err != nil {
		http.Error(w, "bad token", http.StatusBadRequest)
		return
	}

	log.Printf("Ws conn from %s to %s\n", token.PlayerId, token.RoomId)

	room, foundRoom := roomById[token.RoomId]
	if !foundRoom {
		http.Error(w, "bad room", http.StatusBadRequest)
		return
	}
	player, foundPlayer := room.playerMap[token.PlayerId.String()]
	if !foundPlayer {
		http.Error(w, "bad room", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, req, nil)
	playerConn := NewPlayerConn(conn, player, room)
	room.conns[token.PlayerId.String()] = playerConn

	if err != nil {
		log.Printf("Not a websocket handshake: %s\n", err.Error())
		http.Error(w, "bad token", http.StatusBadRequest)
		return
	}

	log.Printf("Reciving messages for %s\n", token.PlayerName)
	go receiveMessages(playerConn, room)
}
