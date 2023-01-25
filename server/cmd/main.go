package cmd

import (
	"flag"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/macqm/teexid/game"
	"github.com/macqm/teexid/game/config"
	"github.com/macqm/teexid/game/handlers"
	"github.com/rs/cors"
)

var addr = flag.String("addr", ":8080", "http service address")
var roomMaxDurationMin = flag.Int("room-timeout", 30, "max room duration")
var minPlayers = flag.Int("min-payers", 2, "min player count")
var host = flag.String("host", "localhost", "")
var port = flag.String("port", "8080", "")
var origin = flag.String("allowed-origin", "http://localhost:3000", "")

// All the cards available
var cardCount = flag.Int("card-count", 55, "How many cards")

func start() {
	router := mux.NewRouter()

	game := game.NewGame()
	router.HandleFunc("/join_room", func(w http.ResponseWriter, req *http.Request) {
		handlers.HandleJoinRoom(w, req, game)
	})
	router.HandleFunc("/game_command", func(w http.ResponseWriter, req *http.Request) {
		handlers.HandleGameCommand(w, req, game)
	})
	router.HandleFunc("/ws", func(w http.ResponseWriter, req *http.Request) {
		handlers.HandleWebSocket(w, req, game)
	})
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	log.Printf("Host %s:%s\n", *host, *port)
	log.Printf("Allowed origin: %s\n", config.Cfg.AllowedOrigin)

	c := cors.New(cors.Options{
		Debug:            false,
		AllowedOrigins:   []string{config.Cfg.AllowedOrigin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowCredentials: true,
		AllowedHeaders: []string{
			"Content-Type", "Bearer", "bearer", "content-type", "Origin", "Accept",
			"X-Game-Token", "x-game-token"},
		AllowPrivateNetwork: true,
		OptionsPassthrough:  false,
	})
	handler := c.Handler(router)

	go game.StartCleanup(*roomMaxDurationMin)

	log.Printf("Starting to listen on %s...\n", *addr)
	err := http.ListenAndServe(*addr, handler)
	if err != nil {
		log.Fatal(err)
	}
}

func Main() {
	flag.Parse()
	config.InitConfig(*origin, *cardCount, *minPlayers)
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Printf("Starting...")
	start()
}
