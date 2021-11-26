package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var addr = flag.String("addr", "localhost:8080", "http service address")

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// TODO Check origin in prod
		log.Println("Host" + r.Host)
		log.Println(r.RemoteAddr)
		return r.Host == "localhost:8080"
	},
} // use mostly default options

func echo(w http.ResponseWriter, r *http.Request) {
	log.Print("echo")

	conn, err := upgrader.Upgrade(w, r, nil)
	_, ok := err.(websocket.HandshakeError)
	if !ok {
		http.Error(w, "Not a websocket handshake", http.StatusBadRequest)
		return
	} else if err != nil {
		log.Println("Handshake error", err.Error())
		return
	}
	defer conn.Close()
	for {
		mt, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}
		log.Printf("recv: %s", message)
		err = conn.WriteMessage(mt, message)
		if err != nil {
			log.Println("write:", err)
			break
		}
	}
}

var rooms []*Room = make([]*Room, 0)

func handleRoom(w http.ResponseWriter, req *http.Request) {

	// To be removed in prod
	w.Header().Add("Access-Control-Allow-Origin", "http://localhost:3000")

	if req.Method == http.MethodPost {
		room := NewRoom()
		rooms = append(rooms, room)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(room)
	} else if req.Method == http.MethodGet {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(rooms)
	} else {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
	}
}

func getRoom(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	log.Printf("Joining %s", vars["roomId"])
	w.Header().Add("Access-Control-Allow-Origin", "http://localhost:3000")
	w.WriteHeader(http.StatusOK)
}

func start(staticDir string) {
	r := mux.NewRouter()
	r.HandleFunc("/echo", echo)
	r.HandleFunc("/rooms", handleRoom).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/rooms/{roomId}", getRoom)

	// This will serve files under http://localhost:8080/static/<filename>
	cards := make([]string, 0)
	err := filepath.Walk(staticDir+"/cards/", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			fmt.Println(err)
			return err
		}
		if !info.IsDir() {
			cards = append(cards, path)
		}
		return nil
	})

	if err != nil {
		log.Fatal(err)
	}

	for _, card := range cards {
		log.Println("Card: " + card)
	}

	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir(staticDir))))

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

func main() {
	var staticDir string
	flag.StringVar(&staticDir, "dir", "./../app/public", "the directory to serve files from. Defaults to the current dir")
	flag.Parse()
	log.Printf("Starting...")
	start(staticDir)
}
