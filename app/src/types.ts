import Player from "./models/Player";

// Web socket response
export type ResponseMsg<T> = {
  type: string;
  payload: T;
};

export type ErrorPayload = {
  type: string;
  message: string;
};

export type OnPlayersUpdatedPayload = {
  players: Player[];
};
