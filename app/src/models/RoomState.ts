import Player from "./Player";

export type GameState = 'waiting' | 'playing' | 'ended';

export type JoinedStatus = 'joined' | 'loading' | 'not_joined';

export default interface RoomState {
  // Id of the room
  id: string,
  // Current player
  playerId: string,
  // Current player's name
  playerName: string,
  // All players (including current)
  players: Player[]
  // State of the game in this room
  state: GameState,

  joinedStatus: JoinedStatus
}
