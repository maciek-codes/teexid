import { PlayerState, Card, GameState, Scores, TurnState } from "./models";

export type JoinRoom = {
  type: "join_room";
  payload: {
    roomName: string;
    playerName: string;
  };
};

export type OnJoinRoom = {
  type: "on_join_room";
  payload: { roomName: string; playerName: string; success: boolean };
};

export type MarkReady = {
  type: "mark_ready";
  payload?: {};
};

export type OnRoomStateUpdated = {
  type: "on_room_state_updated";
  payload: {
    roomName: string;
    state: {
      // What state are we in the game
      gameState: GameState;
      // What state are we in the turn
      turnState: TurnState;
      // Cards on hand
      cardsDealt: Card[];
      // What turn are we on
      turnNumber: number;
      // How this turn ended
      turnResult:
        | null
        | "story_guessed"
        | "nobody_guessed"
        | "everyone_guessed";
      // List of players and their states
      players: PlayerState[];
      // Story
      story: string;
      // What story cards were submitted by all players
      cardsSubmitted: Card[];
      // List of scores for each round
      scores: Scores[];
      // What story card the player submitted
      submittedCard: Card | null;
      // What story card the player voted for
      votedForCard: Card | null;
    };
  };
};

// Associate WS client with a player
type Identify = {
  type: "identify";
  payload: {
    playerId: string;
  };
};

type UpdateName = {
  type: "update_name";
  payload: {
    newName: string;
  };
};

type StartGame = {
  type: "start_game";
};

type RestartGame = {
  type: "restart_game";
};

type OnNameUpdated = {
  type: "on_name_updated";
  payload: {
    name: string;
  };
};

type SubmitStory = {
  type: "submit_story";
  payload: {
    story: string;
    cardId: number;
  };
};

type SubmitStoryCard = {
  type: "submit_story_card";
  payload: {
    cardId: number;
  };
};

type VoteForStoryCard = {
  type: "vote";
  payload: {
    cardId: number;
  };
};

type OnError = {
  type: "error";
  payload: {
    code:
      | "room_not_found"
      | "identify_required"
      | "not_your_turn"
      | "invalid_vote";
    message?: string;
  };
};

export type MessageType =
  | { type: "ping" }
  | { type: "pong" }
  | Identify
  | JoinRoom
  | OnJoinRoom
  | MarkReady
  | UpdateName
  | OnNameUpdated
  | StartGame
  | RestartGame
  | SubmitStory
  | SubmitStoryCard
  | VoteForStoryCard
  | OnRoomStateUpdated
  | OnError;

export type GameMessage = Exclude<
  MessageType,
  { type: "pong" } | { type: "ping" }
>;

export type RoomState = "waiting" | "playing" | "ended";
