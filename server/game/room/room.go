package room

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/macqm/teexid/game/cards"
	"github.com/macqm/teexid/game/config"
	"github.com/macqm/teexid/game/player"
	"github.com/macqm/teexid/game/vote"
)

type Room struct {
	Id             string    `json:"id"`
	State          RoomState `json:"state,omitempty"`
	OwnerId        uuid.UUID `json:"ownerId"`
	PlayerMap      map[string]*player.Player
	roomLock       *sync.RWMutex
	playerMapMutex *sync.RWMutex
	Conns          map[string]*PlayerConn
	connsMutex     *sync.RWMutex
	cardIds        []int
	discardCardIds []int
	Turns          []*Turn
	CurrentTurn    *Turn
	CreatedAt      time.Time `json:"createdAt"`
}

func NewRoom(cardIds []int, playerId uuid.UUID, roomId string) *Room {
	log.Printf("Creating a new room: %s\n", roomId)
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(cardIds), func(i, j int) {
		cardIds[i], cardIds[j] = cardIds[j], cardIds[i]
	})
	room := Room{Id: roomId,
		State:          WaitingForPlayers,
		PlayerMap:      make(map[string]*player.Player, 0),
		roomLock:       &sync.RWMutex{},
		playerMapMutex: &sync.RWMutex{},
		Conns:          make(map[string]*PlayerConn, 0),
		connsMutex:     &sync.RWMutex{},
		Turns:          make([]*Turn, 0),
		CurrentTurn:    nil,
		cardIds:        cardIds,
		OwnerId:        playerId,
		CreatedAt:      time.Now(),
	}
	return &room
}

func (r *Room) Players() []*player.Player {
	var players = make([]*player.Player, 0, len(r.PlayerMap))
	for _, val := range r.PlayerMap {
		players = append(players, val)
	}
	return players
}

func (r *Room) BroadcastPlayers() {
	b, _ := json.Marshal(struct {
		Players []*player.Player `json:"players"`
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

	for _, playerConn := range r.Conns {
		log.Printf("Writing %s to %s\n", string(b), playerConn.Player.Id)
		playerConn.SendText(b)
	}
}

// Return cards for voting
func GetCardsForVoting(room *Room, p *player.Player) []int {
	cardIds := make([]int, 0)
	if room.CurrentTurn != nil && room.CurrentTurn.TurnState == Voting {
		for _, cardSubmitted := range room.CurrentTurn.CardsSubmitted {
			// Send cards for voting except the one player submitted themselves
			if cardSubmitted.PlayerId != p.Id.String() {
				cardIds = append(cardIds, cardSubmitted.CardId)
			}
		}
		if room.CurrentTurn.StoryCard != -1 {
			cardIds = append(cardIds, room.CurrentTurn.StoryCard)
		}

		// Shuffle
		rand.Seed(time.Now().UnixNano())
		rand.Shuffle(len(cardIds), func(i, j int) {
			cardIds[i], cardIds[j] = cardIds[j], cardIds[i]
		})
	}
	return cardIds
}

func GetPlayersWhoSubmitted(r *Room) []string {
	var submittedBy = make([]string, 0)
	if r.CurrentTurn.TurnState == Voting {
		for _, vote := range r.CurrentTurn.Votes {
			submittedBy = append(submittedBy, vote.Voter.Id.String())
		}
	} else if r.CurrentTurn.TurnState == SelectingCards {
		for _, cardSubmitted := range r.CurrentTurn.CardsSubmitted {
			submittedBy = append(submittedBy, cardSubmitted.PlayerId)
		}
	}
	return submittedBy
}

// Send room status change to all players
func (r *Room) BroadcastRoomState() {
	for _, playerConn := range r.Conns {

		// Only reveal the story card to the story player
		storyCard := 0
		if r.CurrentTurn.StoryPlayerId == playerConn.Player.Id {
			storyCard = r.CurrentTurn.StoryCard
		}

		b, _ := json.Marshal(struct {
			Id             string    `json:"id"`
			RoomState      RoomState `json:"roomState"`
			TurnState      TurnState `json:"turnState"`
			TurnNumber     int       `json:"turnNumber"`
			StoryPlayerId  string    `json:"storyPlayerId"`
			Story          string    `json:"story"`
			CardsSubmitted []int     `json:"cardsSubmitted"`
			Cards          []int     `json:"cards"`
			Submitted      []string  `json:"submittedBy"`
			StoryCard      int       `json:"storyCard,omitempty"`
		}{
			Id:             r.Id,
			RoomState:      r.State,
			TurnState:      r.CurrentTurn.TurnState,
			TurnNumber:     len(r.Turns),
			StoryPlayerId:  r.CurrentTurn.StoryPlayerId.String(),
			Story:          r.CurrentTurn.Story,
			Cards:          playerConn.Player.Cards,
			CardsSubmitted: GetCardsForVoting(r, playerConn.Player),
			Submitted:      GetPlayersWhoSubmitted(r),
			StoryCard:      storyCard,
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
		playerConn.SendText(b)
	}
}

func (r *Room) AddPlayer(p *player.Player) {
	r.PlayerMap[p.Id.String()] = p
	// TODO: Move to when ws in established
}

func (r *Room) RemovePlayer(p *player.Player) {
	delete(r.PlayerMap, p.Id.String())
	r.BroadcastPlayers()
}

func (r *Room) StartGame() {
	r.State = PlayingGame

	// Deal cards to each player
	r.sendCardsToEach(5)

	// Next player tells the story
	r.nextTurn()

	// Update the room
	r.BroadcastRoomState()
}

func (r *Room) DiscardCard(p *player.Player, cardId int) {
	// Remove from player, move to discard pile
	r.discardCardIds = append(r.discardCardIds, cardId)

	// Find index of the card to remove
	var idxToRemove = -1
	for index, card := range p.Cards {
		if card == cardId {
			idxToRemove = index
			break
		}
	}
	if idxToRemove == -1 {
		log.Printf("Can't discard %d, not in hand", cardId)
		return
	}

	// Swap the card with the last
	var cardsInHand = len(p.Cards)
	var lastCard = cardsInHand - 1
	p.Cards[idxToRemove] = p.Cards[lastCard]
	p.Cards = p.Cards[:lastCard]
	log.Printf("Discarding card %d, cards %s", cardId,
		strings.Trim(
			strings.Join(strings.Fields(fmt.Sprint(p.Cards)), ","), "[]"))
}

func (r *Room) nextTurn() {
	nextTurn := NewTurn(r)
	r.Turns = append(r.Turns, nextTurn)

	playerIds := make([]uuid.UUID, 0, len(r.PlayerMap))
	for _, player := range r.PlayerMap {
		playerIds = append(playerIds, player.Id)
	}
	// Sort players by ID
	sort.Slice(playerIds, func(i, j int) bool {
		return playerIds[i].String() < playerIds[j].String()
	})

	if r.CurrentTurn == nil {
		nextTurn.StoryPlayerId = playerIds[0]
	} else {
		// Find the next player
		for idx, playerId := range playerIds {
			if r.CurrentTurn.StoryPlayerId == playerId {
				if idx+1 >= len(playerIds) {
					nextTurn.StoryPlayerId = playerIds[0]
				} else {
					nextTurn.StoryPlayerId = playerIds[idx+1]
				}
				break
			}
		}
	}
	r.CurrentTurn = nextTurn
}

func (r *Room) sendCardsToEach(cardCount int) {
	var playerCount = len(r.Players())
	if len(r.cardIds) < playerCount {
		log.Print("Need to shuffle discard pile")
		// shuffle discard and move all to cards
		rand.Shuffle(len(r.discardCardIds), func(i, j int) {
			r.discardCardIds[i], r.discardCardIds[j] = r.discardCardIds[j], r.discardCardIds[i]
		})

		r.cardIds = append(r.cardIds, r.discardCardIds...)
		r.discardCardIds = make([]int, 0)
	}
	for _, player := range r.Players() {
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
	if !r.CurrentTurn.HasAllVotes() {
		return
	}

	r.CurrentTurn.TurnState = Scoring
	var votesForStoryPlayer = 0
	for _, vote := range r.CurrentTurn.Votes {
		if vote.Voted.Id == r.CurrentTurn.StoryPlayerId {
			votesForStoryPlayer += 1
		}
	}

	var allRightOrAllWrong = votesForStoryPlayer == 0 || votesForStoryPlayer == len(r.PlayerMap)-1

	if allRightOrAllWrong {
		// Storyplayer gets 0 points, everyone else gets 2
		for _, player := range r.PlayerMap {
			if player.Id != r.CurrentTurn.StoryPlayerId {
				player.Points += 2
			}
		}
	} else {
		// Story player gets 3 points
		r.PlayerMap[r.CurrentTurn.StoryPlayerId.String()].Points += 3

		// Players who voted for the storyteller’s card also score 3
		for _, vote := range r.CurrentTurn.Votes {
			log.Printf("Player %s voted for %s (3p)", vote.Voter.Name, vote.Voted.Name)
			if vote.Voted.Id == r.CurrentTurn.StoryPlayerId {
				r.PlayerMap[vote.Voter.Id.String()].Points += 3
			}
		}
	}

	// In addition, each player (except the storyteller) scores
	// 1 bonus for each vote received on their own card.
	for _, vote := range r.CurrentTurn.Votes {
		log.Printf("Player %s voted for %s (1p)", vote.Voter.Name, vote.Voted.Name)
		if vote.Voted.Id != r.CurrentTurn.StoryPlayerId {
			r.PlayerMap[vote.Voted.Id.String()].Points += 1
		}
	}

	// Check if any has 30 points
	var maxScorePlayer *player.Player = nil
	for _, player := range r.Players() {

		if player.Points >= config.Cfg.GetMaxScore() &&
			(maxScorePlayer == nil || maxScorePlayer.Points < player.Points) {
			maxScorePlayer = player
		}
	}

	// Submit the votes to players, reveal the cards
	r.revealTurnResults()

	if maxScorePlayer != nil {
		r.endGame()
		return
	}

	// Deal new card to each player
	r.sendCardsToEach(1)

	// Next player tells the story
	log.Print("Next turn")
	r.nextTurn()

	r.BroadcastRoomState()
	r.BroadcastPlayers()
}

func (r *Room) revealTurnResults() {
	b, _ := json.Marshal(struct {
		Votes         []*vote.Vote          `json:"votes"`
		Submitted     []cards.CardSubmitted `json:"cardsSubmitted"`
		StoryPlayerId string                `json:"storyPlayerId"`
		StoryCard     int                   `json:"storyCard"`
		Story         string                `json:"story"`
	}{
		Votes:         r.CurrentTurn.Votes,
		Submitted:     r.CurrentTurn.CardsSubmitted,
		StoryCard:     r.CurrentTurn.StoryCard,
		StoryPlayerId: r.CurrentTurn.StoryPlayerId.String(),
		Story:         r.CurrentTurn.Story,
	})

	payloadMessage := json.RawMessage(b)

	message := ReponseMessage{
		Type:    "on_turn_result",
		Payload: &payloadMessage}

	b, _ = json.Marshal(message)

	log.Printf("Writing %s\n", string(b))
	for _, playerConn := range r.Conns {
		playerConn.SendText(b)
	}
}

func (r *Room) endGame() {
	r.State = Ended
	r.BroadcastRoomState()
	r.BroadcastPlayers()
}
