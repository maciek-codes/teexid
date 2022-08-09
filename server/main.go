package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var addr = flag.String("addr", "localhost:8080", "http service address")

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// TODO Check origin in prod
		log.Println("Host: " + r.Host)
		log.Println("Remote address: " + r.RemoteAddr)
		return r.Host == "localhost:8080"
	},
} // use mostly default options

// ALl the rooms in the game
var rooms []*Room = make([]*Room, 0)

// All the cards available
var cards []*Card = make([]*Card, 0)

var roomByPlayerId map[string]*Room = make(map[string]*Room, 0)

var playerByPlayerId map[string]*Player = make(map[string]*Player, 0)

/// Respond with a card
func handleCards(w http.ResponseWriter, req *http.Request) {
	// To be removed in prod
	w.Header().Add("Access-Control-Allow-Origin", "http://localhost:3000")

	// Get card id
	vars := mux.Vars(req)
	cardId64, _ := strconv.ParseInt(vars["cardId"], 10, 32)
	cardId := int(cardId64)

	// Respond
	if req.Method == http.MethodGet {
		if len(cards) <= cardId || cardId < 0 {
			log.Printf("Not found card id %d", cardId)
			w.WriteHeader(http.StatusNotFound)
		} else {
			log.Printf("Redirecting to %s", cards[cardId].Url)
			http.Redirect(w, req, cards[cardId].Url, http.StatusFound)
		}
	} else {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
	}
}

func startSocket(w http.ResponseWriter, req *http.Request) {
	// To be removed in prod
	w.Header().Add("Access-Control-Allow-Origin", "http://localhost:3000")

	conn, err := upgrader.Upgrade(w, req, nil)

	if _, ok := err.(websocket.HandshakeError); ok {
		log.Println("Not a websocket handshake")
		http.Error(w, "Not a websocket handshake", http.StatusBadRequest)
		return
	} else if err != nil {
		log.Println("Not a websocket handshake: " + err.Error())
		http.Error(w, "Unknown socket error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	go receiveMessages(conn)
}

func receiveMessages(conn *websocket.Conn) {
	// Recieve messages from that connection in a coroutine
	for {
		if conn == nil {
			break
		}
		_, payload, err := conn.ReadMessage()
		if err != nil {
			// TODO use ping/pong to detect real disconnect
			log.Printf("Disconnected")
			if conn != nil {
				conn.Close()
			}
			return
		}

		var command Command
		err = json.Unmarshal(payload, &command)
		if err != nil {
			log.Printf("Unknown message: %s", err.Error())
			continue
		}
		handleCommandFromClient(conn, &command)
	}

	if conn != nil {
		conn.Close()
	}
}

func handleCommandFromClient(conn *websocket.Conn, command *Command) {
	playerId, err := GetPlayerIdFromToken(command.Token)
	if err != nil {
		log.Println("Invalid token: " + command.Token + ". Error:" + err.Error())
		return
	}

	log.Println("Got command " + command.Type + " from " + playerId.String())

	if command.Type == "join_room" {
		handleJoinRoom(conn, &playerId, command.Data)
	} else if command.Type == "create_room" {
		handleCreateRoom(conn, &playerId, command.Data)
	} else {

		// Find player/room
		room := roomByPlayerId[playerId.String()]
		player := playerByPlayerId[playerId.String()]
		if room == nil {
			log.Println("Need room to handle " + command.Type)
			return
		}
		room.HandleRoomCommand(player, *command)
	}

}

func handleJoinRoom(conn *websocket.Conn, playerId *uuid.UUID, message string) *Room {
	joinCommand := struct {
		RoomId     string `json:"roomId"`
		PlayerName string `json:"playerName"`
	}{}

	err := json.Unmarshal([]byte(message), &joinCommand)
	if err != nil {
		log.Print("Error unmarshalling story")
		return nil
	}

	// Find the room
	// TODO: Make it a look up
	var room *Room
	for _, r := range rooms {
		if r.Id == joinCommand.RoomId {
			room = r
			break
		}
	}

	if room == nil {
		sendError(conn, "room_not_found", "Room not found")
		return nil
	}

	player := NewPlayer(joinCommand.PlayerName, *playerId)
	playerByPlayerId[playerId.String()] = player

	room.AddPlayer(player, conn)
	roomByPlayerId[player.IdAsString()] = room

	b, _ := json.Marshal(struct {
		RoomId   string `json:"roomId"`
		OwnerId  string `json:"ownerId"`
		PlayerId string `json:"playerId"`
	}{RoomId: room.Id, OwnerId: room.OwnerId.String(), PlayerId: player.IdAsString()})
	payload := json.RawMessage(b)

	resposneMsg := ReponseMessage{
		Type:    "on_joined",
		Payload: &payload}

	b, _ = json.Marshal(resposneMsg)

	log.Printf("Writing %s\n", string(b))
	err = conn.WriteMessage(websocket.TextMessage, []byte(b))

	if err != nil {
		fmt.Println(err)
	}
	return room
}

func handleCreateRoom(conn *websocket.Conn, playerId *uuid.UUID, message string) *Room {
	createRoomCommand := struct {
		PlayerName string `json:"playerName"`
	}{}

	err := json.Unmarshal([]byte(message), &createRoomCommand)
	if err != nil {
		log.Print("Error unmarshalling story")
		return nil
	}

	// cards for the room
	cardIds := make([]int, 0)
	for _, card := range cards {
		cardIds = append(cardIds, card.Id)
	}

	room := NewRoom(cardIds, *playerId)
	rooms = append(rooms, room)

	b, _ := json.Marshal(struct {
		RoomId string `json:"roomId"`
	}{RoomId: room.Id})
	payload := json.RawMessage(b)

	resposneMsg := ReponseMessage{
		Type:    "on_room_created",
		Payload: &payload}

	b, _ = json.Marshal(resposneMsg)

	log.Printf("Writing %s\n", string(b))
	conn.WriteMessage(websocket.TextMessage, []byte(b))

	return room
}

func sendError(conn *websocket.Conn, errorType string, errorMsg string) {
	b, _ := json.Marshal(struct {
		Type string `json:"type"`
		Msg  string `json:"message"`
	}{Type: errorType, Msg: errorMsg})

	errorMessageJson := json.RawMessage(b)

	message := ReponseMessage{
		Type:    "error",
		Payload: &errorMessageJson}

	b, err := json.Marshal(&message)
	if err != nil {
		log.Println("Error marshalling", err)
		return
	}

	log.Printf("Writing %s\n", string(b))

	conn.WriteMessage(websocket.TextMessage, b)
}

func start(staticDir string) {
	r := mux.NewRouter()
	r.HandleFunc("/auth", handleAuth).Methods("POST")
	r.HandleFunc("/ws", startSocket).Methods("GET")
	r.HandleFunc("/cards/{cardId}", handleCards)

	// This will serve files under http://localhost:8080/static/<filename>
	err := buildCards(staticDir)

	if err != nil {
		log.Fatal(err)
	}

	r.PathPrefix("/static/").Handler(
		http.StripPrefix("/static/", http.FileServer(
			http.Dir(staticDir))))

	srv := &http.Server{
		Handler: r,
		Addr:    *addr,
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Printf(("Starting to listen"))
	log.Fatal(srv.ListenAndServe())
}

func buildCards(staticDir string) error {
	cardIdx := 0
	err := filepath.Walk(staticDir+"/cards/", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			url := "http://" + *addr + "/static/cards/" + info.Name()
			log.Printf("Adding card url: %s", url)
			cards = append(cards, &Card{Id: cardIdx, Url: url})
			cardIdx++
		}
		return nil
	})
	return err
}

func main() {
	var staticDir string
	flag.StringVar(&staticDir, "dir", "./../app/public", "the directory to serve files from. Defaults to the current dir")
	flag.Parse()
	log.Printf("Starting...")
	start(staticDir)
}
