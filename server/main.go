package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
)

var addr = flag.String("addr", ":8080", "http service address")
var roomMaxDurationMin = flag.Int("room-timeout", 5, "max room duration")
var host = flag.String("host", "localhost", "")
var port = flag.String("port", "8080", "")
var origin = flag.String("allowed-origin", "localhost:3000", "")

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
			log.Printf("%s disconnected from %s", pconn.player.Name, room.Id)
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
		pconn.lastPing = time.Now()
		message := ReponseMessage{Type: "pong"}
		b, _ := json.Marshal(message)
		pconn.ws.WriteMessage(websocket.TextMessage, b)
	}
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

func start() {
	router := mux.NewRouter()
	router.HandleFunc("/join_room", HandleJoinRoom)
	router.HandleFunc("/game_command", HandleGameCommand)
	router.HandleFunc("/ws", startSocket)
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		return
	})

	log.Printf("Host %s:%s\n", *host, *port)
	log.Printf("Allowed origin: %s\n", config.allowedOrigin)

	
	c := cors.New(cors.Options{
		Debug: true,
		AllowedOrigins:     []string{config.allowedOrigin},
		AllowedMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowCredentials:   true,
		AllowedHeaders:     []string{
			"Content-Type", "Bearer", "bearer", "content-type", "Origin", "Accept", 
			"X-Game-Token", "x-game-token"},
		AllowPrivateNetwork: true,
		OptionsPassthrough: false,
	})
	handler := c.Handler(router)

	
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
	err := http.ListenAndServe(":8080", handler)
	if err != nil {
		log.Fatal(err)
	}
}

func main() {
	flag.Parse()
	config = NewConfig(*origin, *cardCount)
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Printf("Starting...")
	start()
}
