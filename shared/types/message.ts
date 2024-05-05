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

export type OnRejoinRoom = {
  type: "on_rejoin_room";
  payload: {
    roomName: string;
    playerName: string;
    success: boolean;
    state: {
      gameState: GameState;
      turnState: TurnState;
      turnNumber: number;
      players: PlayerState[];
      story: string;
      cardsSubmitted: Card[];
      scores: Scores[];
    };
  };
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
      gameState: GameState;
      turnState: TurnState;
      cardsDealt: Card[];
      turnNumber: number;
      players: PlayerState[];
      story: string;
      cardsSubmitted: Card[];
      scores: Scores[];
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

type OnRoundEnded = {
  type: "on_round_ended";
  payload: {
    storyCard: Card;
    storyPlayerName: string;
    scores: Scores;
  };
};

export type MessageType =
  | { type: "ping" }
  | { type: "pong" }
  | Identify
  | JoinRoom
  | OnJoinRoom
  | OnRejoinRoom
  | MarkReady
  | UpdateName
  | OnNameUpdated
  | StartGame
  | SubmitStory
  | SubmitStoryCard
  | VoteForStoryCard
  | OnRoundEnded
  | OnRoomStateUpdated
  | { type: "error"; payload: any };

export type GameMessage = Exclude<
  MessageType,
  { type: "pong" } | { type: "ping" }
>;

export type RoomState = "waiting" | "playing" | "ended";
