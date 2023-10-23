import Player from "./models/Player";
import { RoomState, TurnState, Card } from "@teexid/shared";

// Web socket response
export type ResponseMsg =
  | { type: "on_room_created"; payload: OnRoomCreatedPayload }
  | { type: "on_room_state_updated"; payload: OnRoomStateUpdatedPayload }
  | { type: "error"; payload: ErrorPayload }
  | { type: "pong"; payload: unknown }
  | { type: "on_joined"; payload: OnJoinedPayload }
  | { type: "on_players_updated"; payload: OnPlayersUpdatedPayload }
  | { type: "on_turn_result"; payload: OnTurnResultPayload };
type OnJoinedPayload = {
  roomId: string;
  ownerId: string;
  playerId: string;
  cards: number[];
  roomState: RoomState;
  turnState: TurnState;
  storyPlayerId: string;
  story: string;
  cardsSubmitted: number[];
  players: Player[];
};

type Vote = {
  voter: Player;
  voted: Player;
  cardId: number;
};

type CardSubmitted = {
  playerId: string;
  cardId: number;
};

export type OnTurnResultPayload = {
  votes: Vote[];
  cardsSubmitted: CardSubmitted[];
  storyPlayerId: string;
  storyCard: number;
  story: string;
};

type OnRoomCreatedPayload = {
  roomId: string;
};

type OnCardsPayload = {
  cards: number[];
};

export type ErrorPayload = {
  type: string;
  message: string;
};

export type OnPlayersUpdatedPayload = {
  players: Player[];
};

export type OnRoomStateUpdatedPayload = {
  roomState: RoomState;
  turnState: TurnState;
  turnNumber: number;
  storyPlayerId: string;
  story: string;
  cardsSubmitted: number[];
  cards: number[];
};

export type GameLogEntryCard = {
  playerSubmitted: string;
  cardId: number;
  playersVoted: string[];
};

export type GameLogEntry = {
  story: string;
  storyPlayerId: string;
  storyCard: number;
  cardsSubmitted: Map<number, GameLogEntryCard>;
  allVotesForStory: boolean;
  noVotesForStory: boolean;
};
