package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var addr = flag.String("addr", ":8080", "http service address")
var roomMaxDurationMin = flag.Int("room-timeout", 5, "max room duration")
var env = flag.String("env", "dev", "Front end host")

// All the cards available
var cardCount = flag.Int("card-count", 55, "How many cards")
var config *Config

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		log.Println("Host: " + r.Host)
		log.Println("Remote address: " + r.RemoteAddr)
		return r.Host == config.frontendHostName
	},
} // use mostly default options

// All the rooms in the game
var roomById map[string]*Room = make(map[string]*Room, 0)

func startSocket(w http.ResponseWriter, req *http.Request) {
	// To be removed in prod
	w.Header().Add("Access-Control-Allow-Origin", "http://localhost:3000")

	conn, err := upgrader.Upgrade(w, req, nil)
	log.Println("Connected")

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
			break
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

	log.Printf("Got command %s from %s with data %s",
		command.Type, playerId.String(), command.Data)

	if command.Type == "join_room" {
		handleJoinRoom(conn, &playerId, command.Data)
	} else if command.Type == "create_room" {
		handleCreateRoom(conn, &playerId, command.Data)
	} else {

		// Find player/room
		roomMsg := struct {
			RoomId string `json:"roomId"`
		}{}

		err := json.Unmarshal([]byte(command.Data), &roomMsg)
		if err != nil {
			sendError(conn, "story_error", "Bad msg: "+command.Data)
			return
		}
		room := roomById[roomMsg.RoomId]
		if room != nil {
			player := room.playerMap[playerId.String()]
			if player != nil {
				room.HandleRoomCommand(player, *command)
				return
			}
		}
		log.Println("Need room to handle " + command.Type)
	}

}

func handleJoinRoom(conn *websocket.Conn, playerId *uuid.UUID, message string) {
	joinCommand := struct {
		RoomId     string `json:"roomId"`
		PlayerName string `json:"playerName"`
		Players    Player
	}{}

	err := json.Unmarshal([]byte(message), &joinCommand)
	if err != nil {
		log.Print("Error unmarshalling story")
		return
	}

	// Find the room
	var room = roomById[joinCommand.RoomId]

	if room == nil {
		sendError(conn, "room_not_found", "Room not found")
		return
	}

	// Check if player already exist - may be re-joining
	player := room.playerMap[playerId.String()]
	if player != nil {
		log.Printf("Found player %s in the room\n", player.Id.String())
		room.conns[playerId.String()] = NewPlayerConn(conn, player, room)
	} else {
		log.Printf("Player %s not in the room yet\n", playerId)
		player = NewPlayer(joinCommand.PlayerName, *playerId)
		if player == nil {
			panic("no player")
		}
		room.AddPlayer(player, conn)
	}

	// Send on_joined msg
	b, _ := json.Marshal(struct {
		RoomId         string    `json:"roomId"`
		OwnerId        string    `json:"ownerId"`
		PlayerId       string    `json:"playerId"`
		PlayerCards    []int     `json:"cards"`
		RoomState      RoomState `json:"roomState"`
		TurnState      TurnState `json:"turnState"`
		Players        []*Player `json:"players"`
		Story          string    `json:"story"`
		CardsSubmitted []int     `json:"cardsSubmitted"`
		StoryPlayerId  uuid.UUID `json:"storyPlayerId"`
	}{
		RoomId:         room.Id,
		OwnerId:        room.OwnerId.String(),
		PlayerId:       player.Id.String(),
		PlayerCards:    player.Cards,
		RoomState:      room.State,
		TurnState:      room.TurnState,
		Players:        room.Players(),
		Story:          room.Story,
		StoryPlayerId:  room.StoryPlayerId,
		CardsSubmitted: GetCardsForVoting(room),
	})
	payload := json.RawMessage(b)

	responseMsg := ReponseMessage{
		Type:    "on_joined",
		Payload: &payload}

	b, _ = json.Marshal(responseMsg)

	log.Printf("Writing %s\n", string(b))
	err = conn.WriteMessage(websocket.TextMessage, []byte(b))

	if err != nil {
		fmt.Println(err)
	}
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
	for idx := 0; idx < *cardCount; idx++ {
		cardIds = append(cardIds, idx)
	}

	room := NewRoom(cardIds, *playerId)
	roomById[room.Id] = room

	b, _ := json.Marshal(struct {
		RoomId string `json:"roomId"`
	}{RoomId: room.Id})
	payload := json.RawMessage(b)

	responseMsg := ReponseMessage{
		Type:    "on_room_created",
		Payload: &payload}

	b, _ = json.Marshal(responseMsg)

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

func start() {
	r := mux.NewRouter()
	r.HandleFunc("/auth", handleAuth).Methods("POST")
	r.HandleFunc("/ws", startSocket).Methods("GET")

	log.Printf("Using env %s", *env)
	log.Printf("Using hostname %s", config.frontendHostName)

	srv := &http.Server{
		Handler: r,
		Addr:    *addr,
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	roomCleanupTimer := time.NewTimer(2 * time.Second)
	go func() {
		<-roomCleanupTimer.C
		for _, val := range roomById {
			diff := time.Since(val.CreatedAt)
			if int(diff.Minutes()) >= *roomMaxDurationMin {
				delete(roomById, val.Id)
			}
		}
	}()

	log.Printf(("Starting to listen"))
	log.Fatal(srv.ListenAndServe())
}

func main() {
	flag.Parse()
	config = NewConfig(*env, *cardCount)
	log.Printf("Starting...")
	start()
}
