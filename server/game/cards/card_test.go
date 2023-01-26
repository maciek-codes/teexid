package cards

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewCard(t *testing.T) {
	assert := assert.New(t)
	card := NewCard("player1", 2)
	assert.EqualValues("player1", card.PlayerId)
	assert.EqualValues(2, card.CardId)
}
