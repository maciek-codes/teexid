package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
)

type PlayerReadyState int32

const (
	Waiting PlayerReadyState = iota
	Ready
)

type Player struct {
	Id         uuid.UUID        `json:"id"`
	Name       string           `json:"name"`
	ReadyState PlayerReadyState `json:"-"`
	Ready      bool             `json:"ready"`
	Points     int              `json:"points"`
	Cards      []int            `json:"-"`
}

func NewPlayer(name string, playerId uuid.UUID) *Player {
	return &Player{
		Id:         playerId,
		Name:       name,
		ReadyState: Waiting,
		Points:     0,
		Cards:      make([]int, 0)}
}

func (p *Player) SetName(newName string) {
	p.Name = newName
}

func (p *Player) SetReady() {
	p.ReadyState = Ready
	p.Ready = true
}

func (p *Player) HasCard(cardId int) bool {
	for _, card := range p.Cards {
		if card == cardId {
			return true
		}
	}
	return false
}

func (p *Player) IsReady() bool {
	return p.ReadyState == Ready
}

func (p *Player) discardCard(r *Room, cardId int) {
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
