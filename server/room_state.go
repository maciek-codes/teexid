package main

import "bytes"

type RoomState int32

const (
	WaitingForPlayers RoomState = iota
	PlayingGame
	Ended
)

var toString = map[RoomState]string{
	WaitingForPlayers: "waiting",
	PlayingGame:       "playing",
	Ended:             "ended",
}

func (rs RoomState) MarshallJson() ([]byte, error) {
	buffer := bytes.NewBufferString(`"`)
	buffer.WriteString(toString[rs])
	buffer.WriteString(`"`)
	return buffer.Bytes(), nil
}
