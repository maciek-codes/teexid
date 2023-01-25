package handlers

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/macqm/teexid/game"
	"github.com/macqm/teexid/game/auth"
	"github.com/macqm/teexid/game/config"
	"github.com/macqm/teexid/game/room"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		if config.Cfg.AllowedOrigin == "*" {
			return true
		}
		var origin = r.Header.Get("Origin")
		return origin == config.Cfg.AllowedOrigin
	},
} // use mostly default options

func HandleWebSocket(w http.ResponseWriter, req *http.Request, game *game.Game) {
	queryValues := req.URL.Query()

	tokenStr := queryValues.Get("token")

	token, err := auth.ParseJwt(tokenStr)
	if err != nil {
		http.Error(w, "bad token", http.StatusBadRequest)
		return
	}

	log.Printf("Ws conn from %s to %s\n", token.PlayerId, token.RoomId)

	r, foundRoom := game.FindByRoomName(token.RoomId)
	if !foundRoom {
		log.Printf("ws: Room not found")
		http.Error(w, "bad room", http.StatusBadRequest)
		return
	}
	player, foundPlayer := r.PlayerMap[token.PlayerId.String()]
	if !foundPlayer {
		log.Printf("ws: Not found player with token in the room")
		http.Error(w, "bad room", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, req, nil)
	playerConn := room.NewPlayerConn(conn, player)
	r.Conns[token.PlayerId.String()] = playerConn

	if err != nil {
		log.Printf("ws: Not a websocket handshake: %s\n", err.Error())
		http.Error(w, "bad token", http.StatusBadRequest)
		return
	}

	log.Printf("ws: Reciving messages for %s\n", token.PlayerName)
	go playerConn.ReceiveMessages(player, r)
}
