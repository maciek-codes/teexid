package main

import (
	"flag"
	"log"
	"net/http"
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
	if err != nil {
		log.Print("upgrade:", err)
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

func createGame(writer http.ResponseWriter, req *http.Request) {

}

func listGames(writer http.ResponseWriter, req *http.Request) {

}

func joinGame(writer http.ResponseWriter, req *http.Request) {
	log.Printf("Joining")
	msg := make([]byte, 4)
	msg[0] = 200
	writer.Write(msg)
}

func start(staticDir string) {
	r := mux.NewRouter()
	r.HandleFunc("/echo", echo)
	r.HandleFunc("/createGame", createGame)
	r.HandleFunc("/listGames", listGames)
	r.HandleFunc("/joinGame", joinGame)

	// This will serve files under http://localhost:8080/static/<filename>
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir(staticDir))))

	log.Printf(("Starting to listen"))

	srv := &http.Server{
		Handler: r,
		Addr:    *addr,
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Fatal(srv.ListenAndServe())
}

func main() {
	var staticDir string
	flag.StringVar(&staticDir, "dir", "./../app/public", "the directory to serve files from. Defaults to the current dir")
	flag.Parse()
	log.Printf("Starting...")
	start(staticDir)
}
