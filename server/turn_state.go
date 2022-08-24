package main

import "bytes"

type TurnState string

const (
	NotStarted      TurnState = "not_started"
	WaitingForStory TurnState = "waiting_for_story"
	SelectingCards  TurnState = "selecting_cards"
	Voting          TurnState = "voting"
	Scoring         TurnState = "scoring"
)

var turnStateToString = map[TurnState]string{
	NotStarted:      "not_started",
	WaitingForStory: "waiting_for_story",
	SelectingCards:  "selecting_cards",
	Voting:          "voting",
	Scoring:         "scoring",
}

func (ts TurnState) MarshalJSON() ([]byte, error) {
	buffer := bytes.NewBufferString(`"`)
	buffer.WriteString(turnStateToString[ts])
	buffer.WriteString(`"`)
	return buffer.Bytes(), nil
}
