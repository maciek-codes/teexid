import {
  Card,
  GameState,
  MessageType,
  PlayerState,
  Scores,
  TurnState,
} from "@teexid/shared";
import { create } from "zustand";
import { getWsHost } from "../utils/config";

import { devtools } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

type JoinedState = "not_joined" | "joining" | "joined" | "failed_to_join";

const NAME_KEY = "55d78e7c-9f3e-49e4-9385-0ee53138972f";
const ID_KEY = "474170b0-affe-4d8e-a7ea-795e416697e6";
const RECONNECT_INTERVAL_MS = 2_000;

const getPlayerNameFromLocalStorage = (): string => {
  const existingName = window.localStorage.getItem(NAME_KEY);
  if (existingName !== null) {
    return existingName;
  }

  return "";
};

const setPlayerNameInLocalStorage = (name: string) => {
  window.localStorage.setItem(NAME_KEY, name);
};

/**
 * Pick id for the user
 */
const getPlayerId = (): string => {
  const existingId = window.localStorage.getItem(ID_KEY);
  if (existingId !== null) {
    return existingId;
  }

  const newId = uuidv4();
  window.localStorage.setItem(ID_KEY, newId);
  return newId;
};

interface RoomState {
  roomId: string;
  ownerId: string;
  gameState: GameState;
  turnNumber: number;
  turnState: TurnState;

  cards: Card[];
  storyCards: Card[];
  cardsSubmitted: Card[];
  players: PlayerState[];
  story: string;
  // Set after the round has ended
  storyCard: Card | null;
  storyPlayerName: string | null;
  scores: Scores[] | null;
}

interface GameStoreState {
  ws: WebSocket | null;
  playerId: string;
  roomName: string;
  roomState: JoinedState;
  room: RoomState;
  playerName: string;
  isConnected: boolean;
  connectionState: "not_connected" | "connecting" | "connected";
}

interface GameStoreActions {
  setRoomName: (name: string) => void;
  setRoomState: (state: JoinedState) => void;
  setPlayerName: (playerName: string) => void;
  setConnected: (isConnected: boolean) => void;
  onAction: (message: MessageType) => void;
  joinRoom: () => void;
  send: (message: MessageType) => void;
}

type GameStore = GameStoreState & GameStoreActions;

const INITIAL_STATE: GameStoreState = {
  isConnected: false,
  ws: null,
  roomState: "not_joined",
  playerName: getPlayerNameFromLocalStorage(),
  playerId: getPlayerId(),
  roomName: "",
  room: {
    roomId: "",
    ownerId: "",
    players: [],
    turnNumber: 0,
    storyCards: [],
    cardsSubmitted: [],
    turnState: "waiting",
    gameState: "waiting",
    story: "",
    cards: [],
    storyCard: null,
    storyPlayerName: "",
    scores: null,
  },
  connectionState: "not_connected",
};

export const useGameStore = create<GameStore & GameStoreActions>()(
  devtools((set, get) => {
    const onConnect = () => {
      set({ isConnected: true });
      get().send({
        type: "identify",
        payload: { playerId: get().playerId },
      });
    };

    const onMsg = (msg: MessageEvent<string>) => {
      const payload = JSON.parse(msg.data);
      console.log("onMsg", payload);
      get().onAction(payload as MessageType);
    };

    const onClose = (msg: CloseEvent) => {
      console.log("onClose", msg);
      set({ isConnected: false });
    };

    // Log errors
    const onError = (e: Event) => {
      console.error("WS error", JSON.stringify(e));
    };

    const connect = () => {
      const ws = new WebSocket(getWsHost());
      ws.addEventListener("open", onConnect);
      ws.addEventListener("message", onMsg);
      ws.addEventListener("close", onClose);
      ws.addEventListener("error", onError);
      set({ ws: ws });
    };

    const disconnect = () => {
      const ws = get().ws;
      ws?.removeEventListener("open", onConnect);
      ws?.removeEventListener("message", onMsg);
      ws?.removeEventListener("close", onClose);
      ws?.removeEventListener("error", onError);
      if (ws?.readyState == WebSocket.OPEN) {
        ws?.close();
      }
    };

    // Try to connect
    setTimeout(() => connect(), 1000);

    // Monitor the connection, reconnect if necessary
    setInterval(() => {
      if (get().ws?.readyState !== WebSocket.OPEN) {
        disconnect();
        connect();
      }
    }, RECONNECT_INTERVAL_MS);

    return {
      ...INITIAL_STATE,
      setPlayerName: (newName) => {
        set({ playerName: newName });
        setPlayerNameInLocalStorage(newName);
      },
      setRoomName: (newName) => set({ roomName: newName.toLocaleLowerCase() }),
      setConnected: (isConnected) => set({ isConnected }),
      setRoomState: (roomState: JoinedState) => set({ roomState }),
      joinRoom: async () => {
        set({ roomState: "joining" });
        get().send({
          type: "join_room",
          payload: {
            roomName: get().roomName,
            playerName: get().playerName,
          },
        });
      },

      send: (msg) => {
        const ws = get().ws;
        if (ws && ws?.readyState === WebSocket.OPEN) {
          console.log("sending", msg);
          ws?.send(JSON.stringify(msg));
        } else {
          console.error("WS not connected: " + ws?.readyState ?? "unknown");
        }
      },

      onAction: (message) => {
        switch (message.type) {
          case "on_join_room": {
            set({
              roomName: message.payload.roomName,
              playerName: message.payload.playerName,
              roomState: message.payload.success ? "joined" : "failed_to_join",
            });
            break;
          }
          case "on_name_updated": {
            set({ playerName: message.payload.name });
            break;
          }
          case "on_room_state_updated": {
            set((state) => ({
              room: {
                ...state.room,
                ...message.payload.state,
                cards: message.payload.state.cardsDealt,
              },
            }));
            break;
          }
          case "on_round_ended": {
            set((state) => ({
              room: {
                ...state.room,
                ...message.payload,
              },
            }));
            break;
          }
        }
      },
    };
  })
);
