import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { useParams } from "react-router-dom";
import Card from "../models/Card";
import Player from "../models/Player";
import {
  GameLogEntry,
  GameLogEntryCards,
  OnTurnResultPayload,
  ResponseMsg,
  RoomState,
  TurnState,
} from "../types";
import { useSocket } from "./WebsocketContext";

type JoinedState = "not_joined" | "joining" | "joined";

type CurrentRoomState = {
  roomId: string;
  ownerId: string;
  joinedState: JoinedState;
  turnState: TurnState;
  roomState: RoomState;
  storyPlayerId: string;
  cards: Card[];
  lastSubmittedCard: number;
  storyCards: Card[];
  players: Player[];
  story: string;
  gameLog: GameLogEntry[];
  submittedBy: string[];
  dispatch: ({ type, payload }: ResponseMsg) => void;
};

const defaultRoomState: CurrentRoomState = {
  roomId: "",
  turnState: "not_started",
  roomState: "waiting",
  ownerId: "",
  joinedState: "not_joined",
  cards: [],
  storyPlayerId: "",
  storyCards: [],
  players: [],
  story: "",
  gameLog: [],
  lastSubmittedCard: -1,
  submittedBy: [],
  dispatch: ({ type, payload }: ResponseMsg) => {},
};

const RoomContext = createContext<CurrentRoomState>(defaultRoomState);

type Props = { children: ReactNode };

const roomStateReducer = (
  prevState: CurrentRoomState,
  { type, payload }: ResponseMsg
): CurrentRoomState => {
  switch (type) {
    case "on_room_created":
    case "on_players_updated":
      return {
        ...prevState,
        ...payload,
      };
    case "on_joined": {
      return {
        ...prevState,
        ...payload,
        cards: payload.cards.map((cardId) => ({ cardId } as Card)),
        storyCards: payload.cardsSubmitted.map((cardId) => {
          return { cardId } as Card;
        }),
        joinedState: "joined",
      };
    }
    case "on_turn_result": {
      return {
        ...prevState,
        gameLog: [...prevState.gameLog, addGameLogEntry(payload)],
      };
    }
    case "on_room_state_updated": {
      return {
        ...prevState,
        ...payload,
        storyCards: payload.cardsSubmitted.map((cardId) => {
          return { cardId } as Card;
        }),
      };
    }
    case "on_cards": {
      return {
        ...prevState,
        cards: payload.cards.map((cardId) => ({ cardId } as Card)),
      };
    }
    default:
      return prevState;
  }
};

export const RoomContextProvider: React.FC<Props> = ({ children }: Props) => {
  const params = useParams();

  const initialState: CurrentRoomState = {
    ...defaultRoomState,
    roomId: params.roomId ?? "",
  };

  const [state, dispatch] = useReducer(roomStateReducer, initialState);

  return (
    <RoomContext.Provider
      value={{
        ...state,
        roomId: params.roomId ?? "",
        dispatch,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = (): CurrentRoomState => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("RoomContextProvider required");
  return ctx;
};

const addGameLogEntry = (payload: OnTurnResultPayload): GameLogEntry => {
  var logEntry = {
    story: payload.story,
    storyPlayerId: payload.storyPlayerId,
    storyCard: payload.storyCard,
    cardsSubmitted: new Map(),
  } as GameLogEntry;

  // Get all the cards that were submitted for the round
  for (const card of payload.cardsSubmitted) {
    logEntry.cardsSubmitted.set(card.cardId, {
      playerSubmitted: card.playerId,
      cardId: card.cardId,
      playersVoted: [],
    } as GameLogEntryCards);
  }

  // + story card
  logEntry.cardsSubmitted.set(payload.storyCard, {
    playerSubmitted: payload.storyPlayerId,
    cardId: payload.storyCard,
    playersVoted: [],
  });

  for (const vote of payload.votes) {
    if (logEntry.cardsSubmitted.has(vote.cardId)) {
      const card = logEntry.cardsSubmitted.get(vote.cardId)!;
      card.playersVoted = [...card?.playersVoted, vote.voter.id];
    }
  }

  return logEntry;
};
