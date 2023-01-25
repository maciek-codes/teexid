import React, { createContext, ReactNode, useContext, useReducer } from "react";
import { useParams } from "react-router-dom";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

import Card from "../models/Card";
import Player from "../models/Player";
import {
  GameLogEntry,
  GameLogEntryCard,
  OnTurnResultPayload,
  ResponseMsg,
  RoomState,
  TurnState,
} from "../types";

type JoinedState = "not_joined" | "joining" | "joined";

type CurrentRoomState = {
  roomId: string;
  ownerId: string;
  joinedState: JoinedState;
  turnState: TurnState;
  turnNumber: number;
  roomState: RoomState;
  storyCard: number;
  storyPlayerId: string;
  cards: Card[];
  storyCards: Card[];
  players: Player[];
  story: string;
  gameLog: GameLogEntry[];
  submittedBy: string[];
  dispatch: ({ type, payload }: ResponseMsg) => void;
  joinRoom: (playerName: string) => void;
};

const NOOP = () => {};

const defaultRoomState: CurrentRoomState = {
  roomId: "",
  turnState: "not_started",
  turnNumber: 1,
  roomState: "waiting",
  ownerId: "",
  joinedState: "not_joined",
  cards: [],
  storyPlayerId: "",
  storyCard: -1,
  storyCards: [],
  players: [],
  story: "",
  gameLog: [],
  submittedBy: [],
  dispatch: NOOP,
  joinRoom: NOOP,
};

const RoomContext = createContext<CurrentRoomState>(defaultRoomState);

type Props = { children: ReactNode };

const roomStateReducer = (
  prevState: CurrentRoomState,
  { type, payload }: ResponseMsg,
  queryClient: QueryClient
): CurrentRoomState => {
  switch (type) {
    case "on_room_created": {
      return {
        ...prevState,
        ...payload,
      };
    }
    case "on_players_updated": {
      payload.players.sort((a, b) => {
        if (a.name > b.name) return 1;
        if (a.name === b.name) return 0;
        return -1;
      });
      return {
        ...prevState,
        ...payload,
      };
    }
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
        gameLog: [addGameLogEntry(payload), ...prevState.gameLog],
      };
    }
    case "on_room_state_updated": {
      if (prevState.turnNumber !== payload.turnNumber) {
        queryClient.invalidateQueries();
      }
      return {
        ...prevState,
        ...payload,
        cards: payload.cards.map((cardId) => ({ cardId } as Card)),
        storyCards: payload.cardsSubmitted.map((cardId) => {
          return { cardId } as Card;
        }),
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

  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(
    (prev: CurrentRoomState, msg: ResponseMsg) => {
      return roomStateReducer(prev, msg, queryClient);
    },
    initialState
  );

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
    allVotesForStory: false,
    noVotesForStory: false,
  } as GameLogEntry;

  // Get all the cards that were submitted for the round
  for (const card of payload.cardsSubmitted) {
    logEntry.cardsSubmitted.set(card.cardId, {
      playerSubmitted: card.playerId,
      cardId: card.cardId,
      playersVoted: [],
    } as GameLogEntryCard);
  }

  // Have all players or none players voted for the story
  const votesForStoryCard = payload.votes.filter(
    (v) => v.cardId === payload.storyCard
  ).length;

  logEntry.allVotesForStory = votesForStoryCard === payload.votes.length;
  logEntry.noVotesForStory = votesForStoryCard === 0;

  for (const vote of payload.votes) {
    if (logEntry.cardsSubmitted.has(vote.cardId)) {
      const card = logEntry.cardsSubmitted.get(vote.cardId)!;
      card.playersVoted = [...card?.playersVoted, vote.voter.id];
    }
  }

  return logEntry;
};
