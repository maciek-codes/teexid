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
	Voter  *Player `json:"voter"`
	Voted  *Player `json:"voted"`
	CardId int     `json:"cardId"`
}

type Room struct {
	Id             string    `json:"id"`
	State          RoomState `json:"state,omitempty"`
	OwnerId        uuid.UUID `json:"ownerId"`
	playerMap      map[string]*Player
	conns          map[string]playerConn
	cardIds        []int
	discardCardIds []int
	cardIdx        int
	votes          []Vote
	cardsSubmitted []CardSubmitted
	mu             sync.Mutex
	TurnState      TurnState `json:"turnState"`
	StoryPlayerId  uuid.UUID `json:"storyPlayerId"`
	Story          string    `json:"story"`
	StoryCard      int       `json:"-"`
	CreatedAt      time.Time `json:"createdAt"`
}

type ReponseMessage struct {
	Type    string           `json:"type"`
	Payload *json.RawMessage `json:"payload"`
}

type CardSubmitted struct {
	PlayerId string `json:"playerId"`
	CardId   int    `json:"cardId"`
}

func NewRoom(cardIds []int, playerId uuid.UUID, roomId string) *Room {
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(cardIds), func(i, j int) {
		cardIds[i], cardIds[j] = cardIds[j], cardIds[i]
	})
	room := Room{Id: roomId,
		State:          WaitingForPlayers,
		playerMap:      make(map[string]*Player, 0),
		conns:          make(map[string]playerConn, 0),
		TurnState:      NotStarted,
		cardIds:        cardIds,
		OwnerId:        playerId,
		StoryCard:      -1,
		StoryPlayerId:  uuid.Nil,
		Story:          "",
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

	for _, playerConn := range r.conns {
		log.Printf("Writing %s to %s\n", string(b), playerConn.player.Id)
		if playerConn.ws != nil {
			playerConn.ws.WriteMessage(websocket.TextMessage, b)
		}
	}
}

// Return cards for voting
func GetCardsForVoting(room *Room, player *Player) []int {
	cardIds := make([]int, 0)
	if room.TurnState == Voting {
		for _, cardSubmitted := range room.cardsSubmitted {
			// Send cards for voting except the one player submitted themselves
			if cardSubmitted.PlayerId != player.Id.String() {
				cardIds = append(cardIds, cardSubmitted.CardId)
			}
		}
		if room.StoryCard != -1 {
			cardIds = append(cardIds, room.StoryCard)
		}

		// Shuffle
		rand.Seed(time.Now().UnixNano())
		rand.Shuffle(len(cardIds), func(i, j int) { cardIds[i], cardIds[j] = cardIds[j], cardIds[i] })
	}
	return cardIds
}

func FindLastSubmitted(r *Room, playerId uuid.UUID) int {
	var lastSubmittedCard = -1
	if playerId == r.StoryPlayerId {
		lastSubmittedCard = r.StoryCard
	} else if r.TurnState == Voting {
		for _, vote := range r.votes {
			if playerId == vote.Voter.Id {
				lastSubmittedCard = vote.CardId
			}
		}
	} else if r.TurnState == SelectingCards {
		for _, cardSubmitted := range r.cardsSubmitted {
			if playerId.String() == cardSubmitted.PlayerId {
				lastSubmittedCard = cardSubmitted.CardId
			}
		}
	}
	return lastSubmittedCard
}

func GetPlayersWhoSubmitted(r *Room) []string {
	var submittedBy = make([]string, 0)
	if r.TurnState == Voting {
		for _, vote := range r.votes {
			submittedBy = append(submittedBy, vote.Voter.Id.String())
		}
	} else if r.TurnState == SelectingCards {
		for _, cardSubmitted := range r.cardsSubmitted {
			submittedBy = append(submittedBy, cardSubmitted.PlayerId)
		}
	}
	return submittedBy
}

// Send room status change to all players
func (r *Room) BroadcastRoomState() {
	for _, playerConn := range r.conns {

		var lastSubmittedCard = FindLastSubmitted(r, playerConn.player.Id)

		b, _ := json.Marshal(struct {
			Id                string    `json:"id"`
			RoomState         RoomState `json:"roomState"`
			TurnState         TurnState `json:"turnState"`
			StoryPlayerId     string    `json:"storyPlayerId"`
			LastSubmittedCard int       `json:"lastSubmittedCard"`
			Story             string    `json:"story"`
			CardsSubmitted    []int     `json:"cardsSubmitted"`
			Submitted         []string  `json:"submittedBy"`
		}{
			Id:                r.Id,
			RoomState:         r.State,
			TurnState:         r.TurnState,
			StoryPlayerId:     r.StoryPlayerId.String(),
			LastSubmittedCard: lastSubmittedCard,
			Story:             r.Story,
			CardsSubmitted:    GetCardsForVoting(r, playerConn.player),
			Submitted:         GetPlayersWhoSubmitted(r),
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

		playerConn.ws.WriteMessage(websocket.TextMessage, b)
	}
}

func (r *Room) AddPlayer(p *Player) {
	r.playerMap[p.Id.String()] = p
	// TODO: Move to when ws in established
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

	// Reset submissions
	r.cardsSubmitted = make([]CardSubmitted, 0)

	playerIds := make([]uuid.UUID, 0, len(r.playerMap))
	currentPlayerId := r.StoryPlayerId

	for _, player := range r.playerMap {
		playerIds = append(playerIds, player.Id)
	}

	// Sort players by ID
	sort.Slice(playerIds, func(i, j int) bool {
		return playerIds[i].String() < playerIds[j].String()
	})

	// First player if choosing for the first time
	if currentPlayerId == uuid.Nil {
		r.StoryPlayerId = playerIds[0]
		return
	}

	// Find the next player
	for idx, playerId := range playerIds {
		if currentPlayerId == playerId {
			if idx+1 >= len(playerIds) {
				r.StoryPlayerId = playerIds[0]
			} else {
				r.StoryPlayerId = playerIds[idx+1]
			}
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
	var playerCount = len(r.conns)
	if len(r.cardIds) < playerCount {
		log.Print("Need to shuffle discard pile")
		// shuffle discard and move all to cards
		rand.Shuffle(len(r.discardCardIds), func(i, j int) {
			r.discardCardIds[i], r.discardCardIds[j] = r.discardCardIds[j], r.discardCardIds[i]
		})

		r.cardIds = append(r.cardIds, r.discardCardIds...)
		r.discardCardIds = make([]int, 0)
	}

	// Deal N cards to each player
	for _, playerConn := range r.conns {
		var player = playerConn.player

		// Calculate N cards from the end
		var startIndex = len(r.cardIds)
		var i = 0
		for i < cardCount && startIndex > 0 {
			startIndex -= 1
			i += 1
		}

		// Move N cards to the player
		player.Cards = append(player.Cards, r.cardIds[startIndex:]...)
		r.cardIds = r.cardIds[:startIndex]

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

		log.Printf("Writing %s\n", string(b))
		if playerConn.ws != nil {
			playerConn.ws.WriteMessage(websocket.TextMessage, b)
		}
	}
}

func (r *Room) HandleRoomCommand(p *Player, command Command) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if command.Type == "player/updateName" {
		var newName = command.Data
		p.SetName(newName)
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
		var countReady = 0
		for _, player := range r.playerMap {
			log.Printf("%s is ready", player.Id.String())
			allReady = allReady && player.IsReady()
			countReady += 1
		}
		if allReady && countReady >= MinPlayers {
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

		p.discardCard(r, story.Card)
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
			sendError(conn, "player/submitCard", "Bad card: "+command.Data)
			return
		}

		// Maybe submitted already?
		for _, alreadySubmittedCard := range r.cardsSubmitted {
			if alreadySubmittedCard.PlayerId == string(p.Id.String()) {
				sendError(conn, "player/submitCard", "Already submitted: "+command.Data)
				return
			}
		}

		// Add the card to submissions
		r.cardsSubmitted = append(r.cardsSubmitted, CardSubmitted{
			PlayerId: p.Id.String(),
			CardId:   submission.CardId,
		})
		p.discardCard(r, submission.CardId)
		if len(r.cardsSubmitted) == len(r.playerMap)-1 {
			r.TurnState = Voting
		}
		r.BroadcastRoomState()
	} else if command.Type == "player/vote" {
		r.handleVoteCommand(p, command.Data)

		// Last vote - all players voted except story teller
		if len(r.votes) == len(r.Players())-1 {
			r.scoreTurn()
		}
	}
}

func (r *Room) handleVoteCommand(p *Player, commandData string) {
	vote := struct {
		CardId int `json:"cardId"`
	}{}

	err := json.Unmarshal([]byte(commandData), &vote)
	if err != nil {
		sendError(r.findConn(p), "story_error", "Bad story: "+commandData)
		return
	}

	if vote.CardId == r.StoryCard {
		var votedPlayer *Player = r.playerMap[r.StoryPlayerId.String()]
		log.Printf("Player %s voted for story card %d from %s", p.Id.String(), vote.CardId, votedPlayer.Name)

		r.votes = append(r.votes, Vote{p, votedPlayer, vote.CardId})
		return
	}

	for _, cardSubmitted := range r.cardsSubmitted {
		if cardSubmitted.CardId == vote.CardId {
			var votedPlayer *Player = r.playerMap[cardSubmitted.PlayerId]
			log.Printf("Player %s voted for submitted card %d from %s", p.Id.String(), vote.CardId, votedPlayer.Name)
			r.votes = append(r.votes, Vote{p, votedPlayer, vote.CardId})
			break
		}
	}
	r.BroadcastRoomState()
}

/*
From: http://www.itsyourmoveoakland.com/game-library-cd/dixit

	If nobody or everybody finds the correct card, the storyteller scores 0,
	and each of the other players scores 2.
	Otherwise the storyteller and whoever found the correct answer score 3.
	Players score 1 point for every vote for their own card.
*/
func (r *Room) scoreTurn() {
	r.TurnState = Scoring
	var votesForStoryPlayer = 0
	for _, vote := range r.votes {
		if vote.Voted.Id == r.StoryPlayerId {
			votesForStoryPlayer += 1
		}
	}

	var allRightOrAllWrong = votesForStoryPlayer == 0 || votesForStoryPlayer == len(r.playerMap)-1

	if allRightOrAllWrong {
		// Storyplayer gets 0 points, everyone else gets 2
		for _, player := range r.playerMap {
			if player.Id != r.StoryPlayerId {
				player.Points += 2
			}
		}
	} else {
		// Story player gets 3 points
		r.playerMap[r.StoryPlayerId.String()].Points += 3

		// Players who voted for the storyteller’s card also score 3
		for _, vote := range r.votes {
			log.Printf("Player %s voted for %s (3p)", vote.Voter.Name, vote.Voted.Name)
			if vote.Voted.Id == r.StoryPlayerId {
				r.playerMap[vote.Voter.Id.String()].Points += 3
			}
		}
	}

	// In addition, each player (except the storyteller) scores
	// 1 bonus for each vote received on their own card.
	for _, vote := range r.votes {
		log.Printf("Player %s voted for %s (1p)", vote.Voter.Name, vote.Voted.Name)
		if vote.Voted.Id != r.StoryPlayerId {
			r.playerMap[vote.Voted.Id.String()].Points += 1
		}
	}

	// Check if any has 30 points
	var maxScorePlayer *Player = nil
	for _, player := range r.Players() {

		if player.Points >= config.GetMaxScore() &&
			(maxScorePlayer == nil || maxScorePlayer.Points < player.Points) {
			maxScorePlayer = player
		}
	}

	// Submit the votes to players, reveal the cards
	r.revealTurnResults()

	// Reset votes
	r.votes = make([]Vote, 0)

	if maxScorePlayer != nil {
		r.endGame()
		return
	}

	// Deal new card to each player
	r.sendCardsToEach(1)

	// Next player tells the story
	r.nextPlayerToTellStory()

	r.BroadcastRoomState()
	r.BroadcastPlayers()
}

func (r *Room) revealTurnResults() {
	b, _ := json.Marshal(struct {
		Votes         []Vote          `json:"votes"`
		Submitted     []CardSubmitted `json:"cardsSubmitted"`
		StoryPlayerId string          `json:"storyPlayerId"`
		StoryCard     int             `json:"storyCard"`
		Story         string          `json:"story"`
	}{Votes: r.votes,
		Submitted:     r.cardsSubmitted,
		StoryCard:     r.StoryCard,
		StoryPlayerId: r.StoryPlayerId.String(),
		Story:         r.Story,
	})

	payloadMessage := json.RawMessage(b)

	message := ReponseMessage{
		Type:    "on_turn_result",
		Payload: &payloadMessage}

	b, _ = json.Marshal(message)

	log.Printf("Writing %s\n", string(b))
	for _, playerConn := range r.conns {
		if playerConn.ws != nil {
			playerConn.ws.WriteMessage(websocket.TextMessage, b)
		}
	}
}

func (r *Room) endGame() {
	r.State = Ended
	r.BroadcastRoomState()
	r.BroadcastPlayers()
}
