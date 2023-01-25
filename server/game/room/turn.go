package room

import (
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/macqm/teexid/game/cards"
	"github.com/macqm/teexid/game/player"
	"github.com/macqm/teexid/game/vote"
)

type Turn struct {
	Id             string
	TurnState      TurnState
	room           *Room
	Votes          []*vote.Vote
	CardsSubmitted []cards.CardSubmitted
	StoryPlayerId  uuid.UUID `json:"storyPlayerId"`
	Story          string    `json:"story"`
	StoryCard      int       `json:"-"`
	CreatedAt      time.Time `json:"createdAt"`
}

func NewTurn(r *Room) *Turn {
	return &Turn{
		TurnState:      WaitingForStory,
		Votes:          make([]*vote.Vote, 0),
		CardsSubmitted: make([]cards.CardSubmitted, 0), StoryCard: -1,
		StoryPlayerId: uuid.Nil,
		Story:         "",
		room:          r,
		CreatedAt:     time.Now(),
	}
}

func (t *Turn) AddCardSubmitted(p *player.Player, cardId int) error {
	// Maybe submitted already?
	for _, alreadySubmittedCard := range t.CardsSubmitted {
		if alreadySubmittedCard.PlayerId == p.Id.String() {
			return errors.New("already submitted the card")
		}
	}

	t.CardsSubmitted = append(t.CardsSubmitted, cards.CardSubmitted{
		PlayerId: p.Id.String(),
		CardId:   cardId,
	})

	t.room.DiscardCard(p, cardId)

	if len(t.CardsSubmitted) == len(t.room.PlayerMap)-1 {
		t.TurnState = Voting
	}
	return nil
}

func (t *Turn) AddVote(voter *player.Player, cardId int) error {
	var foundVoteCard bool
	var votedPlayer *player.Player
	var newVote *vote.Vote
	if cardId == t.StoryCard {
		votedPlayer = t.room.PlayerMap[t.StoryPlayerId.String()]
		newVote = vote.NewVote(voter, votedPlayer, cardId)
		foundVoteCard = true
	} else {
		for _, cardSubmitted := range t.CardsSubmitted {
			if cardSubmitted.CardId == cardId &&
				cardSubmitted.PlayerId != voter.Id.String() {
				votedPlayer = t.room.PlayerMap[cardSubmitted.PlayerId]
				newVote = vote.NewVote(voter, votedPlayer, cardId)
				foundVoteCard = true
				break
			}
		}
	}
	t.Votes = append(t.Votes, newVote)

	log.Printf("Player %s voted for submitted card %d from %s",
		voter.Id.String(),
		newVote.CardId,
		newVote.Voted.Name)

	if !foundVoteCard {
		return errors.New("invalid vote")
	}

	return nil
}

func (t *Turn) HasAllVotes() bool {
	// All players minus the story teller
	return len(t.Votes) == (len(t.room.PlayerMap) - 1)
}
