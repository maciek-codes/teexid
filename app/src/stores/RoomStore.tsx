import { create } from "zustand";

import Card from "../models/Card";
import PlayerState from "../models/Player";
import {
  GameLogEntry,
  GameLogEntryCard,
  OnTurnResultPayload,
  ResponseMsg,
  RoomState,
  TurnState,
} from "../types";

type CurrentRoomState = {
  roomId: string;
  ownerId: string;
  joinedState: JoinedState;
  turnState: TurnState;
  turnNumber: number;
  roomState: RoomState;
  storyCard: number;
  cards: Card[];
  storyCards: Card[];
  players: PlayerState[];
  story: string;
  gameLog: GameLogEntry[];
  submittedBy: string[];
  handleRoomCommand: ({ type, payload }: ResponseMsg) => void;
  joinRoom: (playerName: string) => void;
};

const NOOP = () => {};

export const useRoomStore = create<CurrentRoomState>((set) => ({
  roomId: "",
  setRoomId: (newRoomId: string) => set({ roomId: newRoomId }),

  turnState: "not_started",
  setTurnState: (newTurnState: TurnState) => set({ turnState: newTurnState }),

  turnNumber: 1,
  setTurnturnNumber: (newTurnState: TurnState) =>
    set({ turnState: newTurnState }),

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

  handleRoomCommand: ({ type, payload }: ResponseMsg) => {
    switch (type) {
      case "on_room_created": {
        return set({ ...payload });
      }
      case "on_players_updated": {
        payload.players.sort((a, b) => {
          if (a.name > b.name) return 1;
          if (a.name === b.name) return 0;
          return -1;
        });
        set({ ...payload });
        break;
      }
      case "on_joined": {
        set({
          ...payload,
          cards: payload.cards.map((cardId) => ({ cardId } as Card)),
          storyCards: payload.cardsSubmitted.map((cardId) => {
            return { cardId } as Card;
          }),
          joinedState: "joined",
        });
        break;
      }
      case "on_turn_result": {
        set((prev) => {
          return {
            gameLog: [addGameLogEntry(payload), ...prev.gameLog],
          };
        });
        break;
      }

      default:
        break;
    }
  },
}));

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
