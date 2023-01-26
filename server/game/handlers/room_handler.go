package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/macqm/teexid/game"
	"github.com/macqm/teexid/game/auth"
	"github.com/macqm/teexid/game/cards"
	"github.com/macqm/teexid/game/config"
	"github.com/macqm/teexid/game/player"
	"github.com/macqm/teexid/game/room"
	"github.com/macqm/teexid/game/vote"
)

func HandleJoinRoom(w http.ResponseWriter, req *http.Request, game *game.Game) {
	if req.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	roomToken := req.Header.Get("X-Game-Token")
	token, err := auth.ParseJwt(roomToken)
	if err != nil {
		log.Print(err)
	}
	if token != nil {
		log.Printf("Got token %s %s %s\n", token.PlayerId, token.PlayerName, token.RoomId)
	} else {
		log.Printf("No token\n")
	}

	decoder := json.NewDecoder(req.Body)
	var params struct {
		PlayerName string    `json:"playerName"`
		RoomName   string    `json:"roomName"`
		PlayerId   uuid.UUID `json:"playerId"`
	}
	err = decoder.Decode(&params)
	if err != nil {
		log.Printf("Can't decode params: %s %s\n", err.Error(), req.Body)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if params.PlayerId == uuid.Nil {
		http.Error(w, "Invalid arg: playerId", http.StatusBadRequest)
		return
	}
	if params.PlayerName == "" {
		http.Error(w, "Invalid playerName", http.StatusBadRequest)
		return
	}
	if params.RoomName == "" {
		http.Error(w, "Invalid roomName", http.StatusBadRequest)
		return
	}

	game.RoomLock.Lock()
	defer game.RoomLock.Unlock()
	r, foundRoom := game.FindByRoomName(params.RoomName)
	log.Printf("Found room: %s %s\n", strconv.FormatBool(foundRoom), params.RoomName)

	if token != nil {
		log.Printf("Token roomId: %s, roomName: %s\n", token.RoomId, params.RoomName)
	}

	var roomPlayer *player.Player
	if foundRoom {
		for _, p := range r.Players() {
			if token != nil && params.PlayerId == p.Id {
				roomPlayer = p
				break
			}
		}
	}

	if !foundRoom {
		log.Printf("Room %s not found, creating player %s & room\n", params.RoomName, params.PlayerName)
		roomPlayer = player.NewPlayer(params.PlayerName, params.PlayerId)
		r = game.CreateRoom(roomPlayer, params.RoomName)
		roomToken, err = auth.GenerateNewJWT(r.Id, roomPlayer.Id, roomPlayer.Name)
	} else if foundRoom && roomPlayer == nil {
		if r.State != room.WaitingForPlayers {
			log.Printf("%s trying to join %s after game started\n", params.PlayerName, params.RoomName)
			http.Error(w, "game in progress", http.StatusBadRequest)
			return
		}

		log.Printf("Room %s found, but %s not in there - join\n", params.RoomName, params.PlayerName)
		roomPlayer = player.NewPlayer(params.PlayerName, params.PlayerId)
		r.AddPlayer(roomPlayer)
		roomToken, err = auth.GenerateNewJWT(r.Id, roomPlayer.Id, roomPlayer.Name)
	}

	if r == nil || roomPlayer == nil {
		log.Printf("Sth went wrong, no room, no player\n")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	turnState := room.NotStarted
	turnStory := ""
	turnStoryPlayer := uuid.Nil
	storyCard := 0
	if r.CurrentTurn != nil {
		turnState = r.CurrentTurn.TurnState
		turnStory = r.CurrentTurn.Story
		turnStoryPlayer = r.CurrentTurn.StoryPlayerId
		if turnStoryPlayer == roomPlayer.Id {
			storyCard = r.CurrentTurn.StoryCard
		}
	}

	// Send room state on join
	res := struct {
		Token          string           `json:"roomToken"`
		RoomId         string           `json:"roomId"`
		OwnerId        string           `json:"ownerId"`
		PlayerId       string           `json:"playerId"`
		PlayerCards    []int            `json:"cards"`
		RoomState      room.RoomState   `json:"roomState"`
		TurnState      room.TurnState   `json:"turnState"`
		TurnNumber     int              `json:"turnNumber"`
		Players        []*player.Player `json:"players"`
		Story          string           `json:"story"`
		CardsSubmitted []int            `json:"cardsSubmitted"`
		StoryPlayerId  uuid.UUID        `json:"storyPlayerId"`
		StoryCard      int              `json:"storyCard"`
	}{
		Token:          roomToken,
		RoomId:         r.Id,
		OwnerId:        r.OwnerId.String(),
		PlayerId:       roomPlayer.Id.String(),
		PlayerCards:    roomPlayer.Cards,
		RoomState:      r.State,
		Players:        r.Players(),
		TurnNumber:     len(r.Turns),
		TurnState:      turnState,
		Story:          turnStory,
		StoryPlayerId:  turnStoryPlayer,
		CardsSubmitted: room.GetCardsForVoting(r, roomPlayer),
		StoryCard:      storyCard,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(res)

	// Tell other players that there is an update
	r.BroadcastPlayers()
}

func findRoomAndPlayerFromToken(req *http.Request, game *game.Game) (*room.Room, *player.Player, error) {
	roomToken := req.Header.Get("X-Game-Token")
	token, err := auth.ParseJwt(roomToken)

	if err != nil {
		return nil, nil, err
	}

	room, foundRoom := game.FindByRoomName(token.RoomId)
	if !foundRoom {
		return nil, nil, errors.New("room not found")
	}

	// Verify player in the room
	player, foundPlayer := room.PlayerMap[token.PlayerId.String()]
	if !foundPlayer {
		return nil, nil, errors.New("player not found in the room")
	}

	return room, player, nil
}

type HandlerFn func(*room.Room, *player.Player, *game.Game, *json.RawMessage) (interface{}, error)
type HandlerMap map[string]HandlerFn

var handlerByCommand = HandlerMap{
	"submit_card":   HandleSubmitCardCommand,
	"submit_story":  HandleSubmitStoryCommand,
	"vote":          HandleVoteCommand,
	"ready":         HandleReadyCommand,
	"start":         HandleStartCommand,
	"fetch_history": HandleFetchHistoryCommand,
}

func HandleGameCommand(w http.ResponseWriter, req *http.Request, game *game.Game) {
	if req.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	room, player, err := findRoomAndPlayerFromToken(req, game)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var command struct {
		Command string          `json:"command"`
		Payload json.RawMessage `json:"payload"`
	}

	decoder := json.NewDecoder(req.Body)
	decoder.Decode(&command)

	var res interface{}
	handler, foundHandler := handlerByCommand[command.Command]
	if !foundHandler {
		http.Error(w, "Can't find that command", http.StatusBadRequest)
		return
	}
	res, err = handler(room, player, game, &command.Payload)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(res)
}

func HandleSubmitStoryCommand(r *room.Room, p *player.Player, game *game.Game, payload *json.RawMessage) (interface{}, error) {
	if p.Id != r.CurrentTurn.StoryPlayerId {
		return nil, errors.New("can't tell story now")
	}
	game.RoomLock.Lock()
	defer game.RoomLock.Unlock()
	story := struct {
		Story string `json:"story"`
		Card  int    `json:"cardId"`
	}{}

	err := json.Unmarshal(*payload, &story)
	if err != nil {
		return nil, err
	}

	r.DiscardCard(p, story.Card)
	r.CurrentTurn.Story = story.Story
	r.CurrentTurn.StoryCard = story.Card
	r.CurrentTurn.TurnState = room.SelectingCards
	r.BroadcastRoomState()
	return story, nil
}

func HandleSubmitCardCommand(room *room.Room, player *player.Player, game *game.Game, payload *json.RawMessage) (interface{}, error) {
	var submission struct {
		CardId int `json:"cardId"`
	}
	err := json.Unmarshal(*payload, &submission)
	if err != nil {
		return nil, err
	}

	game.RoomLock.Lock()
	defer game.RoomLock.Unlock()

	// Add the card to submissions
	err = room.CurrentTurn.AddCardSubmitted(player, submission.CardId)
	if err != nil {
		return nil, err
	}
	room.BroadcastRoomState()

	// Write response
	return struct {
		SubmittedCard int `json:"submittedCard"`
	}{
		SubmittedCard: submission.CardId,
	}, nil
}

func HandleReadyCommand(room *room.Room, player *player.Player, game *game.Game,
	payload *json.RawMessage) (interface{}, error) {
	if !player.IsReady() {
		player.SetReady()
		room.BroadcastPlayers()
	}
	return payload, nil
}

func HandleStartCommand(r *room.Room, p *player.Player, game *game.Game, payload *json.RawMessage) (interface{}, error) {
	if p.Id != r.OwnerId {
		return nil, errors.New("not room owner")
	}
	if r.State != room.WaitingForPlayers {
		return nil, errors.New("already started")
	}
	var allReady = true
	var countReady = 0

	for _, player := range r.Players() {
		allReady = allReady && player.IsReady()
		countReady += 1
	}
	if allReady && countReady >= config.Cfg.MinPlayers {
		r.StartGame()
	}
	return payload, nil
}

func HandleVoteCommand(r *room.Room, p *player.Player, game *game.Game, payload *json.RawMessage) (interface{}, error) {
	if r.CurrentTurn.TurnState != room.Voting {
		return nil, errors.New("can't vote now")
	}

	vote := struct {
		CardId int `json:"cardId"`
	}{}

	err := json.Unmarshal(*payload, &vote)
	if err != nil {
		return nil, err
	}

	err = r.CurrentTurn.AddVote(p, vote.CardId)
	if err != nil {
		return nil, err
	}

	r.ScoreTurn()

	r.BroadcastRoomState()
	return vote, nil
}

func HandleFetchHistoryCommand(r *room.Room, p *player.Player, game *game.Game, payload *json.RawMessage) (interface{}, error) {
	type Turndata struct {
		Votes         []*vote.Vote          `json:"votes"`
		Submitted     []cards.CardSubmitted `json:"cardsSubmitted"`
		StoryPlayerId string                `json:"storyPlayerId"`
		StoryCard     int                   `json:"storyCard"`
		Story         string                `json:"story"`
		TurnNumber    int                   `json:"turnNumber"`
	}

	var turns []Turndata
	var err error
	if len(r.Turns) <= 1 {
		turns = make([]Turndata, 0)
	} else {
		turns := make([]Turndata, len(r.Turns)-1)

		for i := 0; i < len(r.Turns)-1; i++ {
			turns[i] = Turndata{
				Votes:         r.CurrentTurn.Votes,
				Submitted:     r.CurrentTurn.CardsSubmitted,
				StoryCard:     r.CurrentTurn.StoryCard,
				StoryPlayerId: r.CurrentTurn.StoryPlayerId.String(),
				Story:         r.CurrentTurn.Story,
				TurnNumber:    i,
			}
		}
	}

	if err != nil {
		return nil, err
	}

	resp := struct {
		Turns []Turndata `json:"turns"`
	}{
		Turns: turns,
	}

	return resp, nil
}
