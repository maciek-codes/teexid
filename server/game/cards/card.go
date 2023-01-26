package cards

type CardSubmitted struct {
	PlayerId string `json:"playerId"`
	CardId   int    `json:"cardId"`
}

func NewCard(submittedBy string, cardId int) *CardSubmitted {
	return &CardSubmitted{
		PlayerId: submittedBy,
		CardId:   cardId,
	}
}
