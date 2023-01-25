package cards

type CardSubmitted struct {
	PlayerId string `json:"playerId"`
	CardId   int    `json:"cardId"`
}
