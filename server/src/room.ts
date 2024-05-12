import { v4 as uuidv4 } from "uuid";

import {
  GameState,
  Card,
  TurnState,
  Scores,
  ScoreLogEntry,
  PlayerStatus,
} from "@teexid/shared";

import { Player } from "./player";
import { Game } from "./game";
import { logger } from "./logger";
import { error } from "console";

const CARDS_TOTAL = 60;
const SECONDS_INACTIVE = 10;

export class Room {
  private readonly game: Game;
  private readonly _id: string;
  name: string;
  story: string;

  playerIds: Array<string> = new Array();
  playerState: Map<
    string,
    {
      name: string;
      ready: boolean;
      inactive: boolean;
      status: PlayerStatus;
      points: number;
      cardsDealt: Card[];
      lastSeen: Date;
    }
  > = new Map();
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

  private get turnResult():
    | null
    | "story_guessed"
    | "nobody_guessed"
    | "everyone_guessed" {
    if (this.turnState !== "finished") {
      return null;
    }

    const votes = Array.from(this.votes.values());
    const votesForStoryCard = votes.filter(
      (voteFor) => voteFor === this.storyPlayerId
    );

    logger.info("Turn result", {
      votes: votes,
      storyPlayerId: this.storyPlayerId,
      votesForStoryCard: votesForStoryCard,
      playerCount: Array.from(this.playerIds.values()).length,
    });

    // All players voted for the story teller
    if (votesForStoryCard.length === this.playerIds.length - 1) {
      return "everyone_guessed";
    }

    // No players voted for the story teller
    if (votesForStoryCard.length === 0) {
      return "nobody_guessed";
    }

    // Otherwise at least one player voted for the story teller
    return "story_guessed";
  }

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

    this.playerIds.push(player.id);
    this.playerState.set(player.id, {
      name: player.name,
      status: "unknown",
      points: 0,
      ready: false,
      inactive: false,
      lastSeen: new Date(),
      cardsDealt: [],
    });

    this.updateRoomState();
    return player;
  }

  updatePlayerName(playerId: string, newName: string) {
    this.playerState.get(playerId).name = newName;
  }

  updateLastSeen(playerId: string) {
    const inactiveCountPre = Array.from(this.playerState.values()).filter(
      (state) => state.inactive
    ).length;

    this.playerState.get(playerId).lastSeen = new Date();

    // Update inactive state for all players
    for (const playerId of this.playerState.keys()) {
      const p = this.playerState.get(playerId);
      p.inactive = Date.now() - p.lastSeen.getTime() > SECONDS_INACTIVE * 1000;
    }

    const inactiveCountAfter = Array.from(this.playerState.values()).filter(
      (state) => state.inactive
    ).length;

    if (inactiveCountAfter !== inactiveCountPre) {
      this.updateRoomState();
    }
  }

  markReady(playerId: string) {
    const state = this.playerState.get(playerId);
    if (state) {
      state.ready = true;
    }
  }

  startTurn() {
    this._gameState = "playing";
    this.turnState = "waiting_for_story";
    //Discard the deck
    this._cardsOnTable = [];

    // Move to the next round
    this.currentTurn += 1;

    // Empty the votes
    this.votes.clear();

    // Set the story player
    this.pickNextStoryTeller();

    // Deal new cards
    for (const playerId of this.playerState.keys()) {
      const cardsDealt = this.playerState.get(playerId).cardsDealt;
      const newCards = this._deck.splice(0, 5 - cardsDealt.length);
      cardsDealt.push(...newCards);
    }

    this.updateRoomState();
  }

  pickNextStoryTeller() {
    this.storyPlayerId =
      this.playerIds[this.currentTurn % this.playerIds.length];

    // Set the story teller
    this.playerState.get(this.storyPlayerId).status = "story_telling";
  }

  public submitStory(playerId: string, story: string, actualStoryCard: number) {
    if (playerId !== this.storyPlayerId) {
      this.game.send(playerId, {
        type: "error",
        payload: {
          code: "not_your_turn",
          message: "It's not your turn to submit a story",
        },
      });
      return;
    }
    this.playerState.get(playerId).status = "story_submitted";
    // Tell other players that they need to pick a card
    this.playerIds.forEach((pid) => {
      if (pid !== playerId) {
        this.playerState.get(pid).status = "picking_card";
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
    this.playerState.get(playerId).status = "submitted_card";
    this.removeCardFromPlayer(cardId, playerId);

    const allSubmitedCard =
      Array.from(this.playerState.values()).filter(
        (playerStatus) => playerStatus.status === "submitted_card"
      ).length ===
      this.playerIds.length - 1;

    if (allSubmitedCard) {
      // Tell players they will now vote
      this.playerIds.forEach((pid) => {
        if (pid !== this.storyPlayerId) {
          this.playerState.get(pid).status = "voting";
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
          code: "invalid_vote",
          message: "Can't vote for this card",
        },
      });
      return;
    }
    const votedFor = voteCard.from;

    if (votedFor === playerId) {
      this.game.send(playerId, {
        type: "error",
        payload: {
          code: "invalid_vote",
          message: "Can't vote for yourself",
        },
      });
      return;
    }

    this.playerState.get(playerId).status = "vote_submitted";
    this.votes.set(playerId, votedFor);

    const allVoted =
      Array.from(this.playerState.values()).filter(
        (playerStatus) => playerStatus.status === "vote_submitted"
      ).length ===
      this.playerIds.length - 1;

    if (allVoted) {
      this.turnState = "finished";
      this.playerIds.forEach((pid) => {
        this.playerState.get(pid).status = "finished";
      });
      this.scoreRound();
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

    for (const playerId of this.playerIds) {
      const isStoryTeller = this.storyPlayerId === playerId;
      const guessedStoryteller =
        !isStoryTeller && this.votes.get(playerId) === this.storyPlayerId;

      const submittedCard = this._cardsOnTable.find((c) => c.from === playerId);

      let pointsToAdd = 0;
      const pointsBefore = this.playerState.get(playerId).points;

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

      // Add +1 point for each extra guess
      if (!isStoryTeller) {
        pointsToAdd += votedForThisPlayer.length;
      }

      logger.info("Scoring round", {
        playerId: playerId,
        pointsToAdd: pointsToAdd,
        isAllRight: allRight,
        isAllWrong: allWrong,
      });

      this.playerState.get(playerId).points += pointsToAdd;

      roundScore[playerId] = {
        turn: this.currentTurn,
        scoreBefore: pointsBefore,
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
    this.game.sendAll(this.id, (p) => {
      const isStoryTeller = this.storyPlayerId === p.id;
      const cardsToShow = [];
      const cardFromPlayer =
        this._cardsOnTable.find((c) => c.from === p.id)?.cardId ?? null;

      const playersVote = this.votes.has(p.id) ? this.votes.get(p.id) : null;
      const cardPlayerVotedFor = playersVote
        ? this._cardsOnTable.find((c) => c.from === playersVote)
        : null;

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
        // shuffle the cards
        cardsToShow.sort(() => Math.random() - 0.5);
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
            turnResult: this.turnResult,
            story: this.story,
            cardsDealt: this.playerState.get(p.id).cardsDealt,
            players: this.playerIds.map((pid) => {
              const state = this.playerState.get(pid);
              return {
                id: pid,
                name: state.name,
                ready: state.ready,
                points: state.points,
                status: state.status ?? "unknown",
                inactive: state.inactive,
              };
            }),
            scores: this.scores,
            cardsSubmitted: cardsToShow,
            submittedCard: cardFromPlayer ? { cardId: cardFromPlayer } : null,
            votedForCard: cardPlayerVotedFor
              ? { cardId: cardPlayerVotedFor.cardId }
              : null,
          },
        },
      };
    });
  }

  // Remove card from players hand
  private removeCardFromPlayer(cardId: number, playerId: string) {
    const cards = this.playerState.get(playerId).cardsDealt;
    const index = cards.findIndex((c) => c.cardId === cardId);
    if (index !== -1) {
      cards.splice(index, 1);
    }
  }
}

function shuffleNewDeck(): Card[] {
  const cards: number[] = [];
  for (let i = 0; i < CARDS_TOTAL; i++) {
    cards[i] = i;
  }

  const swap = (arr: number[], i: number, j: number) => {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  };

  for (let i = 0; i < CARDS_TOTAL; i++) {
    const j = Math.floor(Math.random() * CARDS_TOTAL);
    swap(cards, i, j);
  }
  return cards.map((id) => ({ cardId: id }));
}
