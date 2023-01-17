package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"strconv"
	"strings"
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

func startSocket(w http.ResponseWriter, req *http.Request) {

	conn, err := upgrader.Upgrade(w, req, nil)

	if err != nil {
		log.Printf("Not a websocket handshake: %s\n", err.Error())
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
	token, err := ParseJwt(command.Token)
	if err != nil {
		log.Println("Invalid token: " + command.Token + ". Error:" + err.Error())
		return
	}

	//log.Printf("Handling command for %s (%s) in %s\n", token.PlayerId, token.PlayerName, token.RoomId)
	
	// Try to find the room and the player
	room, foundRoom := roomById[token.RoomId]
	var player *Player
	if foundRoom {
		room.playerMapMutex.RLock()
		player = room.playerMap[token.PlayerId.String()]
		room.playerMapMutex.RUnlock()
	}

	// Make sure the socket is there
	if player != nil {
		room.connsMutex.Lock()
		playerConn, foundConn := room.conns[player.Id.String()]
		if !foundConn || playerConn.ws != conn {
			room.conns[player.Id.String()] = NewPlayerConn(conn, player, room)
		}
		room.connsMutex.Unlock()
	}

	if command.Type == "ping" {
		// Update user's last ping time
		roomLock.TryLock()
		for _, room := range roomById {
			room.connsMutex.Lock()
			for _, conn := range room.conns {
				if conn.player.Id == token.PlayerId {
					conn.lastPing = time.Now()
				}
			}
			room.connsMutex.Unlock()
		}
		roomLock.Unlock()
		message := ReponseMessage{Type: "pong"}
		b, _ := json.Marshal(message)
		conn.WriteMessage(websocket.TextMessage, b)
	} else {
		log.Printf("Got command %s from %s with data %s",
			command.Type, token.PlayerId.String(), command.Data)

		if foundRoom {
			player := room.playerMap[token.PlayerId.String()]
			if player != nil {
				room.HandleRoomCommand(player, *command)
				return
			}
		}
		log.Println("Need room to handle " + command.Type)
	}
}

type joinRoomParams struct {
	PlayerName string `json:"playerName"`
	RoomName   string `json:"roomName"`
	PlayerId   uuid.UUID `json:"playerId"`
}

func handleJoinRoom(w http.ResponseWriter, req *http.Request) {
	if (req.Method == http.MethodOptions) {
		w.WriteHeader(http.StatusOK)
		return
	}

	roomToken := req.Header.Get("X-Game-Token")
	token, err := ParseJwt(roomToken)
	if (token != nil) {
		log.Printf("Got token %s %s %s\n", token.PlayerId, token.PlayerName, token.RoomId)
	} else {
		log.Printf("No token\n")
	}

	decoder := json.NewDecoder(req.Body)
	var params joinRoomParams
	err = decoder.Decode(&params)
	if err != nil {
		log.Printf("Can't decode params: %s\n", err.Error())
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if params.PlayerId == uuid.Nil {
		http.Error(w, "Invalid arg: playerId", http.StatusBadRequest)
	}
	if params.PlayerName == "" {
		http.Error(w, "Invalid playerName", http.StatusBadRequest)
	}
	if params.RoomName == "" {
		http.Error(w, "Invalid roomName", http.StatusBadRequest)
	}

	roomLock.Lock()
	room, foundRoom := roomById[strings.ToLower(params.RoomName)]
	log.Printf("Found room: %s %s\n", strconv.FormatBool(foundRoom), params.RoomName)

	if (token != nil) {
		log.Printf("Token room %s param room %s\n", token.RoomId, params.RoomName)
	}

	var player *Player
	if foundRoom {
		for _, p := range room.Players() {
			if token != nil && params.PlayerId == p.Id {
				player = p
				break
			}
		}
	}
	
	if !foundRoom {
		log.Printf("Room not found, creating player & room\n")
		player = NewPlayer(params.PlayerName, params.PlayerId)
		room = createRoom(player, params.RoomName)
		roomToken, err = GenerateNewJWT(room.Id, player.Id, player.Name)
	} else if foundRoom && player == nil {
		if room.State != WaitingForPlayers {
			http.Error(w, "game in progress", http.StatusBadRequest)
			return
		}

		log.Printf("Room found, but no player there - join\n")
		player = NewPlayer(params.PlayerName, params.PlayerId)
		room.AddPlayer(player)
		roomToken, err = GenerateNewJWT(room.Id, player.Id, player.Name)
	}
		
	roomLock.Unlock()

	if room == nil || player == nil {
		log.Printf("Sth went wrong, no room, no player\n")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}

	// Send room state on join
	res := struct {
		Token             string    `json:"roomToken"`
		RoomId            string    `json:"roomId"`
		OwnerId           string    `json:"ownerId"`
		PlayerId          string    `json:"playerId"`
		PlayerCards       []int     `json:"cards"`
		RoomState         RoomState `json:"roomState"`
		TurnState         TurnState `json:"turnState"`
		Players           []*Player `json:"players"`
		Story             string    `json:"story"`
		CardsSubmitted    []int     `json:"cardsSubmitted"`
		StoryPlayerId     uuid.UUID `json:"storyPlayerId"`
		LastSubmittedCard int       `json:"lastSubmittedCard"`
	}{
		Token: 			   roomToken,
		RoomId:            room.Id,
		OwnerId:           room.OwnerId.String(),
		PlayerId:          player.Id.String(),
		PlayerCards:       player.Cards,
		RoomState:         room.State,
		TurnState:         room.TurnState,
		Players:           room.Players(),
		Story:             room.Story,
		StoryPlayerId:     room.StoryPlayerId,
		CardsSubmitted:    GetCardsForVoting(room, player),
		LastSubmittedCard: FindLastSubmitted(room, player.Id),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(res)


	// Tell other players that there is an update
	room.BroadcastPlayers()
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
	r.HandleFunc("/join_room", handleJoinRoom)
	r.HandleFunc("/ws", startSocket)
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		return
	}).Methods("GET", "POST")

	log.Printf("Host %s:%s\n", *host, *port)
	log.Printf("Allowed origin: %s\n", config.allowedOrigin)

	handler := cors.New(cors.Options{
		AllowedMethods: []string{"GET","POST", "OPTIONS"},
		AllowedOrigins: []string{config.allowedOrigin},
		AllowCredentials: true,
		AllowedHeaders: []string{"Content-Type","Bearer","Bearer ","content-type","Origin","Accept", "X-Game-Token"},
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
		for _, val := range roomById {
			diff := time.Since(val.CreatedAt)
			if int(diff.Minutes()) >= *roomMaxDurationMin {
				delete(roomById, val.Id)
			}
		}
		roomLock.Unlock()
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
