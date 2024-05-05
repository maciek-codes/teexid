import { v4 as uuidv4 } from "uuid";

import {
  GameState,
  Card,
  TurnState,
  Scores,
  ScoreLogEntry,
} from "@teexid/shared";

import { Player } from "./player";
import { Game } from "./game";
import { MessageType } from "../../shared/types/message";
import { logger } from "./logger";

const cardsTotal = 55;

type Move = {
  timestamp: Date;
  playerId?: string;
  action: MessageType["type"];
  payload: unknown;
};

export class Room {
  private readonly game: Game;
  private readonly _id: string;
  name: string;
  story: string;

  players: Map<string, Player> = new Map();
  points: Map<string, number> = new Map();
  votes: Map<string, string> = new Map();
  currentTurn: number = 0;

  private storyCard: number;
  private storyPlayerId: string;
  private _gameState: GameState = "waiting";
  private _deck: Card[] = shuffleNewDeck();
  private _cardsOnTable: { cardId: number; from: string }[] = [];
  private turnState: TurnState = "waiting";
  private scores: Scores[] = [];

  constructor(name: string, game: Game) {
    this._id = uuidv4();
    this.game = game;
    this.name = name;
  }

  public get id() {
    return this._id;
  }

  public get gameState() {
    return this._gameState;
  }

  addPlayer(player: Player) {
    if (this.gameState !== "waiting") {
      throw new Error("Game already started");
    }

    this.players.set(player.id, player);
    this.updateRoomState();
    return player;
  }

  startTurn() {
    this._gameState = "playing";
    this.turnState = "waiting_for_story";

    //Discard the deck
    this._cardsOnTable = [];
    this.currentTurn += 1;
    this.storyPlayerId = Array.from(this.players.keys())[
      this.currentTurn % this.players.size
    ];
    this.players.get(this.storyPlayerId).status = "story_telling";

    for (const player of this.players.values()) {
      const newCards = this._deck.splice(0, 5 - player.cardsDealt.length);
      player.dealCards(newCards);
    }

    this.updateRoomState();
  }

  public submitStory(playerId: string, story: string, actualStoryCard: number) {
    if (playerId !== this.storyPlayerId) {
      this.game.send(playerId, {
        type: "error",
        payload: {
          msg: "It's not your turn to tell a story",
        },
      });
      return;
    }
    this.players.get(playerId).status = "story_submitted";
    // Tell other players that they need to pick a card
    this.players.forEach((p) => {
      if (p.id !== playerId) {
        p.status = "picking_card";
      }
    });
    this.story = story;
    this.storyPlayerId = playerId;

    // remember the story card
    this.storyCard = actualStoryCard;
    this.turnState = "guessing";
    this.removeCardFromPlayer(actualStoryCard, playerId);

    // Add story card to the deck
    this._cardsOnTable.push({ cardId: actualStoryCard, from: playerId });
    this.updateRoomState();
  }

  public submitStoryCard(playerId: string, cardId: number) {
    this._cardsOnTable.push({ cardId: cardId, from: playerId });
    this.players.get(playerId).status = "submitted_card";
    this.removeCardFromPlayer(cardId, playerId);

    const players = Array.from(this.players.values()).filter(
      (p) => p.id !== this.storyPlayerId
    );

    const allSubmitedCard = players.every((p) => p.status === "submitted_card");
    if (allSubmitedCard) {
      // Tell players they will now vote
      this.players.forEach((p) => {
        if (p.id !== this.storyPlayerId) {
          p.status = "voting";
        }
      });
      // Voting state
      this.turnState = "voting";
    }

    this.updateRoomState();
  }

  public vote(playerId: string, voteCardId: number) {
    const voteCard = this._cardsOnTable.find((c) => c.cardId === voteCardId);

    if (voteCard === undefined) {
      this.game.send(playerId, {
        type: "error",
        payload: {
          msg: "Can't vote for this card",
        },
      });
      return;
    }
    const votedFor = voteCard.from;

    if (votedFor === playerId) {
      this.game.send(playerId, {
        type: "error",
        payload: {
          msg: "Can't vote for yourself",
        },
      });
      return;
    }

    this.players.get(playerId).status = "vote_submitted";
    this.votes.set(playerId, votedFor);

    const players = Array.from(this.players.values()).filter(
      (p) => p.id !== this.storyPlayerId
    );
    const allVoted = players.every((p) => p.status === "vote_submitted");
    if (allVoted) {
      this.turnState = "finished";
      this.players.forEach((p) => (p.status = "finished"));
      this.scoreRound();
      this.sendRoundResults();
    }
    this.updateRoomState();
  }

  private scoreRound() {
    let roundScore: Scores = {} as Scores;

    logger.info("Scoring round", {
      votes: this.votes,
    });

    // Each player voted for the story teller
    const allRight = Array.from(this.votes.entries()).every(([_, votedFor]) => {
      return votedFor === this.storyPlayerId;
    });

    // No one voted for the story teller
    const allWrong = Array.from(this.votes.entries()).every(([_, votedFor]) => {
      return votedFor !== this.storyPlayerId;
    });

    for (const playerId of this.players.keys()) {
      const player = this.players.get(playerId);
      const isStoryTeller = this.storyPlayerId === playerId;
      const guessedStoryteller =
        !isStoryTeller && this.votes.get(playerId) === this.storyPlayerId;

      const submittedCard = this._cardsOnTable.find((c) => c.from === playerId);

      let pointsToAdd = 0;

      const votedForThisPlayer = Array.from(this.votes.entries()).reduce(
        (acc, curr) => {
          return curr[1] === playerId ? [curr[0], ...acc] : acc;
        },
        []
      );

      const votesByThisPlayer = this.votes.has(playerId)
        ? this.votes.get(playerId) ?? []
        : [];

      if (allRight || allWrong) {
        if (isStoryTeller) {
          pointsToAdd = 0;
        } else {
          pointsToAdd = 2;
        }
      } else if (!isStoryTeller && guessedStoryteller) {
        pointsToAdd = 3;
      } else if (isStoryTeller) {
        pointsToAdd = 3;
      }

      logger.info("Scoring round", {
        player: player.name,
        pointsToAdd: pointsToAdd,
        isAllRight: allRight,
        isAllWrong: allWrong,
      });

      if (!allRight && !allWrong) {
        pointsToAdd += votedForThisPlayer.length;
      }

      player.points += pointsToAdd;

      roundScore[playerId] = {
        turn: this.currentTurn,
        scoreBefore: 0,
        score: pointsToAdd,
        votesFrom: votedForThisPlayer,
        votedFor: isStoryTeller ? [] : votesByThisPlayer,
        wasStoryTelling: isStoryTeller,
        submittedCard: submittedCard?.cardId ?? null,
      } as ScoreLogEntry;
    }

    this.scores.push(roundScore);
  }

  updateRoomState() {
    const players = Array.from(this.players.values());
    this.game.sendAll(this.id, (p) => {
      const isStoryTeller = this.storyPlayerId === p.id;
      const cardsToShow = [];
      const cardFromPlayer = this._cardsOnTable.find(
        (c) => c.from === p.id
      )?.cardId;

      // Story player gets to see what other submitted
      if (isStoryTeller && ["guessing", "voting"].includes(this.turnState)) {
        cardsToShow.push(
          ...this._cardsOnTable
            .filter((card) => card.cardId !== this.storyCard)
            .map((c) => ({
              cardId: c.cardId,
            }))
        );
      } else if (this.turnState === "voting") {
        cardsToShow.push(
          ...this._cardsOnTable
            // Don't let a player vote for themselves
            .filter((card) => card.cardId !== cardFromPlayer)
            .map((c) => ({
              cardId: c.cardId,
            }))
        );
      }

      return {
        type: "on_room_state_updated",
        payload: {
          roomName: this.name,
          state: {
            // Show the card if the round is finished
            storyCard:
              this.turnState === "finished"
                ? { cardId: this.storyCard }
                : { cardId: -1 },
            gameState: this.gameState,
            turnState: this.turnState,
            turnNumber: this.currentTurn,
            story: this.story,
            cardsDealt: p.cardsDealt,
            players: players.map((p) => ({
              name: p.name,
              id: p.id,
              ready: p.ready,
              points: p.points,
              status: p.status,
              inactive: p.inactive,
            })),
            scores: this.scores,
            cardsSubmitted: cardsToShow,
          },
        },
      };
    });
  }

  private sendRoundResults() {
    this.game.sendAll(this.id, () => ({
      type: "on_round_ended",
      payload: {
        storyCard: { cardId: this.storyCard },
        storyPlayerName: this.players.get(this.storyPlayerId)?.name,
        scores: this.scores[this.scores.length - 1],
      },
    }));
  }

  // Remove card from players hand
  private removeCardFromPlayer(cardId: number, playerId: string) {
    const player = this.players.get(playerId);
    player.removeCard(cardId);
  }
}

function shuffleNewDeck(): Card[] {
  const cards: number[] = [];
  for (let i = 0; i < cardsTotal; i++) {
    cards[i] = i;
  }

  const swap = (arr: number[], i: number, j: number) => {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  };

  for (let i = 0; i < cardsTotal; i++) {
    const j = Math.floor(Math.random() * cardsTotal);
    swap(cards, i, j);
  }
  return cards.map((id) => ({ cardId: id }));
}
