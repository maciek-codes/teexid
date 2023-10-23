import { PlayerState } from "./models";

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
};

export type OnRoomStateUpdated = {
  type: "on_room_state_updated";
  payload: {
    roomName: string;
    state: {
      gameState: GameState;
      players: PlayerState[];
    };
  };
};

export type OnPlayersListUpdated = {
  type: "on_players_list_updated";
  payload: {
    players: PlayerState[];
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
  | OnPlayersListUpdated
  | { type: "on_joined"; payload: { roomName: string; playerName: string } }
  | { type: "on_room_created"; payload: any }
  | OnRoomStateUpdated
  | { type: "error"; payload: any }
  | { type: "on_turn_result"; payload: any };

export type GameMessage = Exclude<
  MessageType,
  { type: "pong" } | { type: "ping" }
>;

export type RoomState = "waiting" | "playing" | "ended";

export type TurnState =
  | "not_started"
  | "waiting_for_story"
  | "selecting_cards"
  | "voting"
  | "scoring";
