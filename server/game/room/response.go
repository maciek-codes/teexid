package room

import "encoding/json"

type ReponseMessage struct {
	Type    string           `json:"type"`
	Payload *json.RawMessage `json:"payload"`
}
