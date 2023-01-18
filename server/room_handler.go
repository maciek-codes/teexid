package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
)

func HandleJoinRoom(w http.ResponseWriter, req *http.Request) {
	if req.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	roomToken := req.Header.Get("X-Game-Token")
	token, err := ParseJwt(roomToken)
	if token != nil {
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
	defer roomLock.Unlock()
	room, foundRoom := roomById[strings.ToLower(params.RoomName)]
	log.Printf("Found room: %s %s\n", strconv.FormatBool(foundRoom), params.RoomName)

	if token != nil {
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
			log.Printf("%s trying to join %s after game started\n", params.PlayerName, params.RoomName)
			http.Error(w, "game in progress", http.StatusBadRequest)
			return
		}

		log.Printf("Room found, but no player there - join\n")
		player = NewPlayer(params.PlayerName, params.PlayerId)
		room.AddPlayer(player)
		roomToken, err = GenerateNewJWT(room.Id, player.Id, player.Name)
	}

	if room == nil || player == nil {
		log.Printf("Sth went wrong, no room, no player\n")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
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
		Token:             roomToken,
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

func findRoomAndPlayerFromToken(req *http.Request) (*Room, *Player, error) {
	roomToken := req.Header.Get("X-Game-Token")
	token, err := ParseJwt(roomToken)

	if err != nil {
		return nil, nil, err
	}

	room, foundRoom := roomById[token.RoomId]
	if !foundRoom {
		return nil, nil, errors.New("Room not found")
	}

	// Verify player in the room
	player, foundPlayer := room.playerMap[token.PlayerId.String()]
	if !foundPlayer {
		return nil, nil, errors.New("Player not found in the room")
	}

	return room, player, nil
}

func HandleGameCommand(w http.ResponseWriter, req *http.Request) {
	if req.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	room, player, err := findRoomAndPlayerFromToken(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var command struct {
		Command string `json:"command"`
		Payload json.RawMessage `json:"payload"`
	}

	decoder := json.NewDecoder(req.Body)
	decoder.Decode(&command)

	var res interface{}
	if (command.Command == "submit_card") {
		res, err = HandleSubmitCardCommand(room, player, &command.Payload)
	} else if (command.Command == "submit_story") {
		res, err = HandleSubmitStoryCommand(room, player, &command.Payload)	
	} else if (command.Command == "vote") {
		res, err = HandleVoteCommand(room, player, &command.Payload)	
	}
		
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(res)
}

func HandleSubmitStoryCommand(room *Room, player *Player, payload *json.RawMessage) (interface{}, error) {
	if player.Id != room.StoryPlayerId {
		return nil, errors.New("Can't tell story now.")
	}
	room.roomLock.Lock()
	defer room.roomLock.Unlock()
	story := struct {
		Story string `json:"story"`
		Card  int    `json:"cardId"`
	}{}

	err := json.Unmarshal(*payload, &story)
	if err != nil {
		return nil, err
	}

	player.discardCard(room, story.Card)
	room.Story = story.Story
	room.StoryCard = story.Card
	room.TurnState = SelectingCards
	room.BroadcastRoomState()
	return story, nil
}

func HandleSubmitCardCommand(room *Room, player *Player, payload *json.RawMessage) (interface{}, error) {
	var submission struct {
		CardId int `json:"cardId"`
	}
	err := json.Unmarshal(*payload, &submission)
	if err != nil {
		return nil, err
	}
	
	room.roomLock.Lock()
	defer room.roomLock.Unlock()
	// Maybe submitted already?
	for _, alreadySubmittedCard := range room.cardsSubmitted {
		if alreadySubmittedCard.PlayerId == player.Id.String() {
			return nil, errors.New("Already submitted the card")
		}
	}
	
	// Add the card to submissions
	room.cardsSubmitted = append(room.cardsSubmitted, CardSubmitted{
		PlayerId: player.Id.String(),
		CardId:   submission.CardId,
	})
	player.discardCard(room, submission.CardId)
	if len(room.cardsSubmitted) == len(room.playerMap)-1 {
		room.TurnState = Voting
	}
	room.BroadcastRoomState()
	
	// Write response
	return struct {
		SubmittedCard int `json:"submittedCard"`
		}{
			SubmittedCard: submission.CardId,
			}, nil
}

func HandleVoteCommand(room *Room, player *Player, payload *json.RawMessage) (interface{}, error) {
	if room.TurnState != Voting {
		return nil, errors.New("Can't vote now")
	}

	vote := struct {
		CardId int `json:"cardId"`
	}{}

	err := json.Unmarshal(*payload, &vote)
	if err != nil {
		return nil, err
	}

	var voteObj Vote
	var foundVote bool
	if vote.CardId == room.StoryCard {
		var votedPlayer *Player = room.playerMap[room.StoryPlayerId.String()]
		voteObj = Vote{player, votedPlayer, vote.CardId}
		foundVote = true
	} else {	
		for _, cardSubmitted := range room.cardsSubmitted {
			if cardSubmitted.CardId == vote.CardId {
				var votedPlayer *Player = room.playerMap[cardSubmitted.PlayerId]
				voteObj = Vote{player, votedPlayer, vote.CardId}
				foundVote = true
				break
			}
		}
	}

	if !foundVote {
		return nil, errors.New("Invalid vote")
	}

	room.votes = append(room.votes, voteObj)

	log.Printf("Player %s voted for submitted card %d from %s", player.Id.String(), vote.CardId, voteObj.Voted.Name)

	// Last vote - all players voted except story teller
	if len(room.votes) == len(room.Players())-1 {
		room.scoreTurn()
	}

	room.BroadcastRoomState()
	return vote, nil
}