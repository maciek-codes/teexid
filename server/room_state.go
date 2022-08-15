package main

import "bytes"

type RoomState int32

const (
	WaitingForPlayers RoomState = iota
	PlayingGame
	Ended
)

var gameStateToString = map[RoomState]string{
	WaitingForPlayers: "waiting",
	PlayingGame:       "playing",
	Ended:             "ended",
}

func (rs RoomState) MarshalJSON() ([]byte, error) {
	buffer := bytes.NewBufferString(`"`)
	buffer.WriteString(gameStateToString[rs])
	buffer.WriteString(`"`)
	return buffer.Bytes(), nil
}
