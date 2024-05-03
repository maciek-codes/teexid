export type GameState = "waiting" | "playing" | "finished";

export type TurnState =
  | "waiting"
  | "waiting_for_story"
  | "guessing"
  | "voting"
  | "finished";

export type PlayerStatus =
  | "unknown"
  | "story_telling"
  | "story_submitted"
  | "picking_card"
  | "submitted_card"
  | "voting"
  | "vote_submitted"
  | "finished";

export type PlayerState = {
  name: string;
  id: string;
  ready: boolean;
  points: number;
  status: PlayerStatus;
};

export type Card = {
  cardId: number;
};

export type ScoreLogEntry = {
  // Turn number
  turn: number;

  // Previous score
  scoreBefore: number;

  // Score for this round
  score: number;

  // Reason for score
  reason: "guessed" | "all_same" | "missed" | "story_guessed";

  // Was the player telling the story
  wasStoryTelling: boolean;

  // Who the player got the votes from
  votesFrom: string[];

  // Who teh player voted for
  voteFor?: string;
};

export type Scores = {
  [x: string]: ScoreLogEntry;
};
