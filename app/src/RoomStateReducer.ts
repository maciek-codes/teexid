import RoomState from "./models/RoomState"

export interface GameMessage {
  type: 'joining' | 'onjoined' | 'onjoinerror' |
  'onplayersupdated' |
  'onturnaction' | 'onroomstateupdated' | 'connect' |
  'playerName'
  payload: any
}

const reducer = (prevState: RoomState, msg: GameMessage): RoomState => {
  console.log("Reducing", msg);
  switch (msg.type) {
    case 'joining': {
      return {
        ...prevState,
        joinedStatus: 'loading'
      }
    }
    case 'onjoinerror': {
      return {
        ...prevState,
        joinedStatus: 'not_joined',
      }
    }
    // Set room id, establish connection to the room
    case 'connect': {
      return {
        ...prevState,
        id: msg.payload.id
      }
    }
    case 'onjoined': {
      return {
        ...prevState,
        id: msg.payload.roomId,
        playerId: msg.payload.playerId,
        joinedStatus: 'joined',
      }
    }
    case 'onplayersupdated': {
      return {
        ...prevState,
        players: msg.payload.players
      }
    }
    case 'onroomstateupdated': {
      return {
        ...prevState,
        gameStatus: msg.payload.state
      }
    }
    case 'playerName': {
      return {
        ...prevState,
        playerName: msg.payload.playerName
      }
    }
    default:
      return prevState;
  }
}

export default reducer;