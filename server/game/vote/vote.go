package vote

import "github.com/macqm/teexid/game/player"

type Vote struct {
	Voter  *player.Player `json:"voter"`
	Voted  *player.Player `json:"voted"`
	CardId int            `json:"cardId"`
}

func NewVote(voter *player.Player, voted *player.Player, cardId int) *Vote {
	return &Vote{
		Voter:  voter,
		Voted:  voted,
		CardId: cardId,
	}
}
