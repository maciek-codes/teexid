export type GameState = "waiting" | "playing" | "finished";

export type TurnState =
  | "waiting"
  | "waiting_for_story"
  | "guessing"
  | "voting"
  | "finished";

export type TurnResult =
  | "story_guessed"
  | "nobody_guessed"
  | "everyone_guessed";

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
  inactive: boolean;
};

export type Card = {
  cardId: number;
};

export type ScoreLogEntry = {
  // Turn number
  turn: number;

  turnResult: TurnResult;

  story: string;

  storyPlayerId: string;

  // Previous score
  scoreBefore: number;

  // Score for this round
  score: number;

  // Was the player telling the story
  wasStoryTelling: boolean;

  // Who the player got the votes from
  votesFrom: string[];

  // Who the player voted for
  votedFor: string[];

  // What card the player submitted
  submittedCard: number;
};

export type Scores = {
  [x: string]: ScoreLogEntry;
};
