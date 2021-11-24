package main

import (
	"flag"
	"log"
	"net/http"

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

func start() {
	http.HandleFunc("/echo", echo)
	http.HandleFunc("/createGame", createGame)
	log.Printf(("Starting to listen"))
	log.Fatal(http.ListenAndServe(*addr, nil))
}

func main() {
	flag.Parse()
	log.Printf("Starting...")
	start()
}
