import Card from "./models/Card";
import Player from "./models/Player";

export type RoomState = "waiting" | "playing" | "ended";
export type TurnState =
  | "not_started"
  | "waiting_for_story"
  | "selecting_cards"
  | "voting"
  | "scoring";

// Web socket response
export type ResponseMsg =
  | { type: "on_room_created"; payload: OnRoomCreatedPayload }
  | { type: "on_room_state_updated"; payload: OnRoomStateUpdatedPayload }
  | { type: "on_cards"; payload: OnCardsPayload }
  | { type: "error"; payload: ErrorPayload }
  | { type: "on_joined"; payload: OnJoinedPayload }
  | { type: "on_players_updated"; payload: OnPlayersUpdatedPayload };

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
  storyPlayerId: string;
  story: string;
  cardsSubmitted: number[];
};
