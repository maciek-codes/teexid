package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
)

var addr = flag.String("addr", ":8080", "http service address")
var roomMaxDurationMin = flag.Int("room-timeout", 5, "max room duration")
var host = flag.String("host", "localhost", "")
var port = flag.String("port", "8080", "")
var origin = flag.String("allowed-origin", "*", "")

// All the cards available
var cardCount = flag.Int("card-count", 55, "How many cards")
var config *Config

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		if config.allowedOrigin == "*" {
			return true
		}
		var origin = r.Header.Get("Origin")
		log.Printf("Origin: %s\n", origin)
		return origin == config.allowedOrigin
	},
} // use mostly default options

// All the rooms in the game
var roomLock *sync.Mutex = &sync.Mutex{}
var roomById map[string]*Room = make(map[string]*Room, 0)

func receiveMessages(pconn *playerConn, room *Room) {
	// Recieve messages from that connection in a coroutine
	for {
		if pconn.ws == nil {
			break
		}
		_, payload, err := pconn.ws.ReadMessage()
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
		handleCommandFromClient(pconn, room, &command)
	}

	if pconn.ws != nil {
		pconn.ws.Close()
	}
}

func handleCommandFromClient(pconn *playerConn, room *Room, command *Command) {
	if command.Type == "ping" {
		// Update user's last ping time
		roomLock.TryLock()
		for _, room := range roomById {
			room.connsMutex.Lock()
			for _, conn := range room.conns {
				if conn.player.Id == pconn.player.Id {
					conn.lastPing = time.Now()
				}
			}
			room.connsMutex.Unlock()
		}
		roomLock.Unlock()
		message := ReponseMessage{Type: "pong"}
		b, _ := json.Marshal(message)
		pconn.ws.WriteMessage(websocket.TextMessage, b)
	} else {
		log.Printf("Got command %s from %s with data %s",
			command.Type, pconn.player.Name, command.Data)
		room.HandleRoomCommand(pconn.player, *command)
	}
}

type joinRoomParams struct {
	PlayerName string    `json:"playerName"`
	RoomName   string    `json:"roomName"`
	PlayerId   uuid.UUID `json:"playerId"`
}

func createRoom(player *Player, roomName string) *Room {
	room, foundRoom := roomById[roomName]

	if !foundRoom {
		// cards for the room
		cardIds := make([]int, 0)
		for idx := 0; idx < *cardCount; idx++ {
			cardIds = append(cardIds, idx)
		}

		room = NewRoom(cardIds, player.Id, roomName)
		roomById[room.Id] = room
	}
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
	r.HandleFunc("/join_room", HandleJoinRoom)
	r.HandleFunc("/game_command", HandleGameCommand)
	r.HandleFunc("/ws", startSocket)
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		return
	}).Methods("GET", "POST")

	log.Printf("Host %s:%s\n", *host, *port)
	log.Printf("Allowed origin: %s\n", config.allowedOrigin)

	handler := cors.New(cors.Options{
		AllowedMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowedOrigins:     []string{config.allowedOrigin},
		AllowCredentials:   true,
		AllowedHeaders:     []string{"Content-Type", "Bearer", "Bearer ", "content-type", "Origin", "Accept", "X-Game-Token"},
		OptionsPassthrough: true,
	}).Handler(r)

	srv := &http.Server{
		Handler: handler,
		Addr:    *addr,
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	roomCleanupTimer := time.NewTimer(2 * time.Second)
	go func() {
		<-roomCleanupTimer.C
		roomLock.Lock()
		defer roomLock.Unlock()
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
	config = NewConfig(*origin, *cardCount)
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Printf("Starting...")
	start()
}
