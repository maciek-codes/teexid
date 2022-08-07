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

var rooms []*Room = make([]*Room, 0)
var cards []*Card = make([]*Card, 0)

func handleRooms(w http.ResponseWriter, req *http.Request) {

	// To be removed in prod
	w.Header().Add("Access-Control-Allow-Origin", "http://localhost:3000")

	params := req.URL.Query()
	token := params.Get("token")
	playerId, err := GetPlayerIdFromToken(token)

	if err != nil {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(err)
		return
	}

	cardIds := make([]int, 0)
	for _, card := range cards {
		cardIds = append(cardIds, card.Id)
	}

	if req.Method == http.MethodPost {
		room := NewRoom(cardIds, playerId)
		rooms = append(rooms, room)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(room)
	} else if req.Method == http.MethodGet {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(rooms)
	} else {
		http.Error(w, "GET or POST only", http.StatusMethodNotAllowed)
	}
}

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

func joinRoom(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	roomId := vars["roomId"]

	params := req.URL.Query()
	playerName := params.Get("playerName")
	token := params.Get("token")
	playerId, err := GetPlayerIdFromToken(token)

	if err != nil {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(err)
		return
	}

	// TODO: Remove in prod
	w.Header().Add("Access-Control-Allow-Origin", "http://localhost:3000")

	conn, err := upgrader.Upgrade(w, req, nil)

	log.Println("Joining player " + playerName + " with id " + playerId.String())

	if _, ok := err.(websocket.HandshakeError); ok {
		http.Error(w, "Not a websocket handshake", http.StatusBadRequest)
		log.Printf("Not a websocket handshake: %d\n", err)
		return
	} else if err != nil {
		log.Println("Handshake error", err.Error())
		return
	}

	// Find the room
	var room *Room
	for _, r := range rooms {
		if r.Id == roomId {
			room = r
			break
		}
	}

	if room == nil {
		log.Println("Not found")
		w.WriteHeader(http.StatusNotFound)
		return
	}

	// Create a player
	player := NewPlayer(playerName, playerId)

	// Write joined message
	playerConn := room.AddPlayer(player, conn)

	b, _ := json.Marshal(struct {
		Joined   bool   `json:"joined"`
		RoomId   string `json:"roomId"`
		OwnerId  string `json:"ownerId"`
		PlayerId string `json:"playerId"`
	}{Joined: true, RoomId: roomId, OwnerId: room.OwnerId.String(), PlayerId: player.IdAsString()})
	payload := json.RawMessage(b)

	message := ReponseMessage{
		Type:    "onjoined",
		Payload: &payload,
	}

	b, _ = json.Marshal(message)

	log.Printf("Writing %s\n", string(b))
	err = conn.WriteMessage(websocket.TextMessage, []byte(b))

	if err != nil {
		fmt.Println(err)
	}

	go playerConn.receiveMessages()
}

func start(staticDir string) {
	r := mux.NewRouter()
	r.HandleFunc("/auth", handleAuth).Methods("POST")
	r.HandleFunc("/rooms", handleRooms).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/rooms/{roomId}", joinRoom)
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
