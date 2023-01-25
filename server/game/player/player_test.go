package player

import (
	"encoding/json"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestCanChangeName(t *testing.T) {
	assert := assert.New(t)

	player := NewPlayer("Jane", uuid.UUID{})
	assert.Equal("Jane", player.Name)
	id := player.Id
	assert.NotEqual("00000000-0000-0000-0000-000000000000", player.Id)

	player.SetName("Jane D.")
	assert.Equal("Jane D.", player.Name)
	assert.Equal(id, player.Id)
}

func TestMarshalling(t *testing.T) {
	assert := assert.New(t)
	player := NewPlayer("Foo", uuid.UUID{})
	player.SetReady()

	arr := make([]*Player, 0)
	arr = append(arr, player)

	marshalled, err := json.Marshal(arr)
	assert.Nil(err)

	var dat []map[string]interface{}
	err = json.Unmarshal(marshalled, &dat)
	assert.Nil(err)
	assert.Equal("Foo", dat[0]["name"])
	assert.Equal(true, dat[0]["ready"])
}
