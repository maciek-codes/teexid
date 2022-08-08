package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const MinPlayers = 3

var randGenSource = rand.NewSource(time.Now().UnixNano())
var randGen = rand.New(randGenSource)

var letters = []rune("abcdefghijklmnopqrstuvwxyz")

func randSeq(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[randGen.Intn(len(letters))]
	}
	return string(b)
}

type GameRoom interface {
	GetId() string
	CanJoin() bool
}

type Room struct {
	Id        string    `json:"id"`
	State     RoomState `json:"state,omitempty"`
	OwnerId   uuid.UUID `json:"ownerId"`
	playerMap map[string]*Player
	conns     map[string]playerConn
	cardIds   []int
	cardIdx   int

	StoryPlayerIdx int    `json:"storyPlayerIndex"`
	Story          string `json:"story"`
	StoryCard      int    `json:"storyCardId"`
}

type ReponseMessage struct {
	Type    string           `json:"type"`
	Payload *json.RawMessage `json:"payload"`
}

func NewRoom(cardIds []int, playerId uuid.UUID) *Room {
	id := randSeq(6)
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(cardIds), func(i, j int) {
		cardIds[i], cardIds[j] = cardIds[j], cardIds[i]
	})
	room := Room{Id: id,
		State:          WaitingForPlayers,
		playerMap:      make(map[string]*Player, 0),
		conns:          make(map[string]playerConn, 0),
		cardIds:        cardIds,
		OwnerId:        playerId,
		StoryPlayerIdx: -1,
		Story:          "",
		StoryCard:      -1,
	}
	return &room
}

func (r *Room) CanJoin() bool {
	return r.State == WaitingForPlayers
}

func (r *Room) Players() []*Player {
	var players = make([]*Player, 0, len(r.playerMap))
	for _, val := range r.playerMap {
		players = append(players, val)
	}
	return players
}

func (r *Room) BroadcastPlayers() {
	b, _ := json.Marshal(struct {
		Players []*Player `json:"players"`
	}{Players: r.Players()})

	playersMessage := json.RawMessage(b)

	message := ReponseMessage{
		Type:    "onplayersupdated",
		Payload: &playersMessage}

	b, err := json.Marshal(&message)
	if err != nil {
		log.Println("Error marshalling", err)
		return
	}

	log.Printf("Writing %s\n", string(b))

	for _, playerConn := range r.conns {
		if playerConn.ws != nil {
			playerConn.ws.WriteMessage(websocket.TextMessage, b)
		}
	}
}

// Send room status change to all players
func (r *Room) BroadcastRoomState() {
	b, _ := json.Marshal(struct {
		Id        string    `json:"id"`
		RoomState RoomState `json:"state"`
	}{Id: r.Id, RoomState: r.State})

	payloadMessage := json.RawMessage(b)

	message := ReponseMessage{
		Type:    "onroomstateupdated",
		Payload: &payloadMessage}

	b, err := json.Marshal(&message)
	if err != nil {
		log.Println("Error marshalling", err)
		return
	}

	log.Printf("Writing %s\n", string(b))

	for _, playerConn := range r.conns {
		playerConn.ws.WriteMessage(websocket.TextMessage, b)
	}
}

func (r *Room) AddPlayer(p *Player, conn *websocket.Conn) playerConn {
	r.playerMap[p.Id.String()] = p
	r.conns[p.IdAsString()] = NewPlayerConn(conn, p, r)
	r.BroadcastPlayers()
	return r.conns[p.IdAsString()]
}

func (r *Room) RemovePlayer(p *Player) {
	delete(r.playerMap, p.Id.String())
	r.BroadcastPlayers()
}

func (r *Room) startGame() {
	r.State = PlayingGame

	// Deal cards to each player
	r.sendCardsToEach(5)

	// Next player tells the story
	r.nextPlayerToTellStory()

	// Update the room
	r.BroadcastRoomState()
}

func (r *Room) nextPlayerToTellStory() {
	// Next player is telling story
	playersCount := len(r.playerMap)
	nextStoryPlayerIdx := r.StoryPlayerIdx + 1
	if nextStoryPlayerIdx >= playersCount {
		nextStoryPlayerIdx = 0
	}
	r.StoryPlayerIdx = nextStoryPlayerIdx
}

func (r *Room) sendCardsToEach(cardCount int) {
	for _, playerConn := range r.conns {

		cardCountToPlayer := cardCount
		cardIds := make([]int, 0)
		for cardCountToPlayer > 0 {
			cardCountToPlayer -= 1
			cardIds = append(cardIds, r.cardIds[r.cardIdx])
			r.cardIdx++
		}

		b, _ := json.Marshal(struct {
			CardIds []int `json:"cards"`
		}{CardIds: cardIds})

		payloadMessage := json.RawMessage(b)

		message := ReponseMessage{
			Type:    "oncards",
			Payload: &payloadMessage}

		b, _ = json.Marshal(message)

		playerConn.ws.WriteMessage(websocket.TextMessage, b)
	}
}

func (r *Room) UpdateState(p *Player, command Command) {
	if command.Type == "player/updateName" {
		var newName = command.Data
		p.SetName(newName)
		r.BroadcastPlayers()
	} else if command.Type == "player/ready" {
		p.SetReady()
		r.BroadcastPlayers()
		var allReady = true
		for _, player := range r.playerMap {
			allReady = allReady && player.IsReady()
		}
		if allReady && len(r.playerMap) >= MinPlayers {
			r.startGame()
			r.BroadcastRoomState()
		}
	} else if command.Type == "player/story" {
		story := struct {
			Story string `json:"story"`
			Card  int    `json:"cardId"`
		}{}

		err := json.Unmarshal([]byte(command.Data), &story)
		if err != nil {
			log.Print("Error unmarshalling story")
			return
		}

		r.Story = story.Story
		r.StoryCard = story.Card
		r.BroadcastRoomState()
	} else if command.Type == "player/storyCard" {
		votedCard, _ := strconv.Atoi(command.Data)
		log.Printf("Player %s voted for card %d", p.IdAsString(), votedCard)
	}
}
