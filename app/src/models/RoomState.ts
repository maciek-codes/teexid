import Player from "./Player";

export type GameStatus = 'waiting' | 'playing' | 'ended';

export type JoinedStatus = 'joined' | 'loading' | 'not_joined';

export type TurnStatus = 'writingStory' | 'waitingForStory' |
  'submittingCard' | 'waitingForOthers' | 'voting' | 'voted';

export interface Card {
  cardId: number
}

export interface TurnState {
  storyPlayerId: string,
  turnStatus: TurnStatus
  storyPrompt: string,
  storyCard: Card,
  pickedCardId: string,
  cardsToVote: string
}

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
  gameStatus: GameStatus,

  playerCards: Card[],

  turn: number

  turnState?: TurnState

  joinedStatus: JoinedStatus
}
