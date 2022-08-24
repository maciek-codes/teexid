package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const MinPlayers = 2

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

type Vote struct {
	Voter  *Player
	Voted  *Player
	CardId int
}

type Room struct {
	Id             string    `json:"id"`
	State          RoomState `json:"state,omitempty"`
	OwnerId        uuid.UUID `json:"ownerId"`
	playerMap      map[string]*Player
	conns          map[string]playerConn
	cardIds        []int
	cardIdx        int
	votes          []Vote
	cardsSubmitted []CardSubmitted
	mu             sync.Mutex

	TurnState     TurnState `json:"turnState"`
	StoryPlayerId uuid.UUID `json:"storyPlayerId"`
	Story         string    `json:"story"`
	StoryCard     int       `json:"storyCardId"`
	CreatedAt     time.Time `json:"createdAt"`
}

type ReponseMessage struct {
	Type    string           `json:"type"`
	Payload *json.RawMessage `json:"payload"`
}

type CardSubmitted struct {
	playerId string
	cardId   int
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
		TurnState:      NotStarted,
		cardIds:        cardIds,
		OwnerId:        playerId,
		StoryPlayerId:  uuid.Nil,
		Story:          "",
		StoryCard:      -1,
		votes:          make([]Vote, 0),
		cardsSubmitted: make([]CardSubmitted, 0),
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
		Type:    "on_players_updated",
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

// Return cards for voting
func GetCardsForVoting(room *Room) []int {
	cardIds := make([]int, 0)
	if room.TurnState == Voting {
		for _, cardSubmitted := range room.cardsSubmitted {
			cardIds = append(cardIds, cardSubmitted.cardId)
		}
		cardIds = append(cardIds, room.StoryCard)

		// Shuffle
		rand.Seed(time.Now().UnixNano())
		rand.Shuffle(len(cardIds), func(i, j int) { cardIds[i], cardIds[j] = cardIds[j], cardIds[i] })
	}
	return cardIds
}

// Send room status change to all players
func (r *Room) BroadcastRoomState() {
	b, _ := json.Marshal(struct {
		Id             string    `json:"id"`
		RoomState      RoomState `json:"state"`
		TurnState      TurnState `json:"turnState"`
		StoryPlayerId  string    `json:"storyPlayerId"`
		Story          string    `json:"story"`
		CardsSubmitted []int     `json:"cardsSubmitted"`
	}{
		Id:             r.Id,
		RoomState:      r.State,
		TurnState:      r.TurnState,
		StoryPlayerId:  r.StoryPlayerId.String(),
		Story:          r.Story,
		CardsSubmitted: GetCardsForVoting(r),
	})

	payloadMessage := json.RawMessage(b)

	message := ReponseMessage{
		Type:    "on_room_state_updated",
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
	r.conns[p.Id.String()] = NewPlayerConn(conn, p, r)
	r.BroadcastPlayers()
	return r.conns[p.Id.String()]
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
	// Update the turn state
	r.TurnState = WaitingForStory

	playerIds := make([]uuid.UUID, 0, len(r.playerMap))
	currentPlayer := r.StoryPlayerId

	for _, player := range r.playerMap {
		playerIds = append(playerIds, player.Id)
	}

	// Sort players by ID
	sort.Slice(playerIds, func(i, j int) bool {
		return playerIds[i].String() < playerIds[j].String()
	})

	if currentPlayer == uuid.Nil {
		r.StoryPlayerId = playerIds[0]
		return
	}

	for idx, key := range playerIds {
		if currentPlayer == key {
			if idx == len(playerIds)-1 {
				idx = 0
			}
			r.StoryPlayerId = playerIds[idx]
			return
		}
	}
}

func (r *Room) findConn(p *Player) *websocket.Conn {
	for _, playerConn := range r.conns {
		if p == playerConn.player {
			return playerConn.ws
		}
	}
	log.Panic("Can't find the connection")
	return &websocket.Conn{}
}

func (r *Room) sendCardsToEach(cardCount int) {
	for _, playerConn := range r.conns {

		var player = playerConn.player
		cardCountToPlayer := cardCount
		player.Cards = make([]int, 0)
		for cardCountToPlayer > 0 {
			cardCountToPlayer -= 1
			if r.cardIdx > len(r.cardIds) {
				break
			}
			player.Cards = append(player.Cards, r.cardIds[r.cardIdx])
			r.cardIdx++
		}

		if len(player.Cards) == 0 {
			return
		}

		b, _ := json.Marshal(struct {
			CardIds []int `json:"cards"`
		}{CardIds: player.Cards})

		payloadMessage := json.RawMessage(b)

		message := ReponseMessage{
			Type:    "on_cards",
			Payload: &payloadMessage}

		b, _ = json.Marshal(message)

		playerConn.ws.WriteMessage(websocket.TextMessage, b)
	}
}

func (r *Room) HandleRoomCommand(p *Player, command Command) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if command.Type == "player/updateName" {
		var newName = command.Data
		p.SetName(newName)
		r.BroadcastPlayers()
	} else if command.Type == "get_players" {
		r.BroadcastPlayers()
	} else if command.Type == "player/ready" {
		p.SetReady()
		r.BroadcastPlayers()
	} else if command.Type == "game/start" {
		if p.Id != r.OwnerId {
			log.Printf("Not room owner: %s", p.Id.String())
			return
		}
		var allReady = true
		for _, player := range r.playerMap {
			allReady = allReady && player.IsReady()
		}
		if allReady && len(r.playerMap) >= MinPlayers {
			r.startGame()
		}
	} else if command.Type == "player/story" {
		conn := r.findConn(p)
		if p.Id != r.StoryPlayerId {
			sendError(conn, "story_error", "Can't tell story now.")
			return
		}
		story := struct {
			Story string `json:"story"`
			Card  int    `json:"cardId"`
		}{}

		err := json.Unmarshal([]byte(command.Data), &story)
		if err != nil {
			sendError(conn, "story_error", "Bad story: "+command.Data)
			return
		}

		r.Story = story.Story
		r.StoryCard = story.Card
		r.TurnState = SelectingCards
		r.BroadcastRoomState()
	} else if command.Type == "player/submitCard" {
		conn := r.findConn(p)
		submission := struct {
			CardId int `json:"cardId"`
		}{}
		err := json.Unmarshal([]byte(command.Data), &submission)
		if err != nil {
			sendError(conn, "story_error", "Bad story: "+command.Data)
			return
		}
		r.cardsSubmitted = append(r.cardsSubmitted, CardSubmitted{
			playerId: p.Id.String(),
			cardId:   submission.CardId,
		})
		if len(r.cardsSubmitted) == len(r.playerMap)-1 {
			r.TurnState = Voting
			r.BroadcastRoomState()
		}
	} else if command.Type == "player/vote" {
		vote := struct {
			CardId int `json:"cardId"`
		}{}
		err := json.Unmarshal([]byte(command.Data), &vote)
		if err != nil {
			sendError(r.findConn(p), "story_error", "Bad story: "+command.Data)
			return
		}

		log.Printf("Player %s voted for card %d", p.Id.String(), vote.CardId)
		for _, otherPlayer := range r.playerMap {
			if otherPlayer.HasCard(vote.CardId) {
				r.votes = append(r.votes, Vote{p, otherPlayer, vote.CardId})
				break
			}
		}

		// Last vote - all players voted except story teller
		if len(r.votes) == len(r.playerMap)-1 {
			r.ScoreTurn()
		}
	}
}

/*
From: http://www.itsyourmoveoakland.com/game-library-cd/dixit
 If nobody or everybody finds the correct card, the storyteller scores 0,
 and each of the other players scores 2.
 Otherwise the storyteller and whoever found the correct answer score 3.
 Players score 1 point for every vote for their own card.
*/
func (r *Room) ScoreTurn() {
	r.TurnState = Scoring
	var votesForStoryPlayer = 0
	for _, vote := range r.votes {
		if vote.Voted.Id == r.StoryPlayerId {
			votesForStoryPlayer += 1
		}
	}

	var allRightOrAllWrong = votesForStoryPlayer == 0 || votesForStoryPlayer == len(r.playerMap)-1

	if allRightOrAllWrong {
		for _, player := range r.playerMap {
			if player.Id != r.StoryPlayerId {
				player.Points += 2
			}
		}
	} else {
		for _, vote := range r.votes {
			log.Printf("Player %s voted for %s", vote.Voter.Name, vote.Voted.Name)
			if vote.Voted.Id == r.StoryPlayerId {
				r.playerMap[vote.Voted.Id.String()].Points += 3
				r.playerMap[vote.Voter.Id.String()].Points += 3
			} else {
				r.playerMap[vote.Voter.Id.String()].Points += 1
			}
		}
	}
	r.BroadcastRoomState()
	r.BroadcastPlayers()
}
