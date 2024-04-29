import {
  Card,
  PlayerState,
  MessageType,
  GameState,
  TurnState,
} from "@teexid/shared";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
type JoinedState = "not_joined" | "joining" | "joined" | "failed_to_join";

const NAME_KEY = "55d78e7c-9f3e-49e4-9385-0ee53138972f";
const ID_KEY = "474170b0-affe-4d8e-a7ea-795e416697e6";

const getPlayerName = (): string => {
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

type RoomState = {
  roomId: string;
  ownerId: string;
  gameState: GameState;
  turnNumber: number;
  turnState: TurnState;
  // storyCard: number;
  // storyPlayerId: string;
  cards: Card[];
  storyCards: Card[];
  cardsSubmitted: Card[];
  players: PlayerState[];
  story: string;
  //gameLog: GameLogEntry[];
  //submittedBy: string[];
};

interface GameStore {
  playerId: string;
  roomName: string;
  setRoomName: (name: string) => void;

  roomState: JoinedState;
  setRoomState: (state: JoinedState) => void;

  room: RoomState;

  playerName: string;
  setPlayerName: (playerName: string) => void;

  isConnected: boolean;
  setConnected: (isConnected: boolean) => void;

  onAction: (message: MessageType) => void;
}

export const useGameStore = create<GameStore>()(
  devtools((set) => ({
    isConnected: false,
    roomState: "not_joined",

    playerName: getPlayerName(),
    setPlayerName: (newName) => {
      set({ playerName: newName });
      setPlayerNameInLocalStorage(newName);
    },

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
    },

    setRoomName: (newName) => set({ roomName: newName.toLocaleLowerCase() }),

    connectionState: "not_connected",
    setConnected: (isConnected) => set({ isConnected }),

    setRoomState: (roomState: JoinedState) => set({ roomState }),
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
            },
          }));
          break;
        }
        case "on_cards_dealt": {
          set((state) => ({
            room: {
              ...state.room,
              cards: message.payload.cards,
            },
          }));
          break;
        }
        case "on_players_list_updated": {
          set((state) => ({
            room: {
              ...state.room,
              players: message.payload.players,
            },
          }));
          break;
        }
      }
    },
  }))
);
