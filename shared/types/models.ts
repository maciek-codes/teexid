export default interface Card {
  cardId: number;
}

export type GameState = "waiting" | "playing" | "finished";

export type PlayerStatus =
  | "unknown"
  | "story_telling"
  | "picking_card"
  | "submitted_card"
  | "voting"
  | "finished";

export type PlayerState = {
  name: string;
  ready: boolean;
  points: number;
  status: PlayerStatus;
};
