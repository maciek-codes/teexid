package game

import (
	"strings"
	"sync"
	"time"

	"github.com/macqm/teexid/game/config"
	"github.com/macqm/teexid/game/player"
	"github.com/macqm/teexid/game/room"
)

type Game struct {
	// All the rooms in the game
	roomsById map[string]*room.Room
	RoomLock  *sync.Mutex
}

func NewGame() *Game {
	return &Game{
		roomsById: make(map[string]*room.Room, 0),
		RoomLock:  &sync.Mutex{},
	}
}

func (g *Game) FindByRoomName(roomName string) (*room.Room, bool) {
	r, found := g.roomsById[strings.ToLower(roomName)]
	return r, found
}

func (g *Game) CreateRoom(player *player.Player, roomName string) *room.Room {
	r, foundRoom := g.FindByRoomName(roomName)

	if !foundRoom {
		// cards for the room
		cardIds := make([]int, 0)
		for idx := 0; idx < config.Cfg.CardCount; idx++ {
			cardIds = append(cardIds, idx)
		}

		r = room.NewRoom(cardIds, player.Id, roomName)
		g.roomsById[r.Id] = r
	}
	return r
}

func (g *Game) StartCleanup(roomMaxDurationMin int) {
	roomCleanupTimer := time.NewTimer(2 * time.Second)
	go func() {
		<-roomCleanupTimer.C
		g.RoomLock.Lock()
		defer g.RoomLock.Unlock()
		for _, val := range g.roomsById {
			diff := time.Since(val.CreatedAt)
			if int(diff.Minutes()) >= roomMaxDurationMin {
				delete(g.roomsById, val.Id)
			}
		}
	}()
}
