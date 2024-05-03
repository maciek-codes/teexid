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
  history: Move[] = [];
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

    this.history.push({
      timestamp: new Date(),
      playerId: player.id,
      action: "join_room",
      payload: { playerName: player.name },
    });

    this.players.set(player.id, player);
    this.updateRoomState();
    return player;
  }

  startGame() {
    this._gameState = "playing";
    this.turnState = "waiting_for_story";
    this.currentTurn = 0;
    this.storyPlayerId = Array.from(this.players.keys())[
      this.currentTurn % this.players.size
    ];
    this.players.get(this.storyPlayerId).status = "story_telling";

    this.history.push({
      timestamp: new Date(),
      action: "start_game",
      payload: {},
    });

    for (const player of this.players.values()) {
      const newCards = this._deck.splice(0, 5);
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
    this.storyCard = actualStoryCard;
    this.turnState = "guessing";

    this.history.push({
      timestamp: new Date(),
      playerId: playerId,
      action: "submit_story",
      payload: { story },
    });

    this.updateRoomState();
  }

  public submitStoryCard(playerId: string, cardId: number) {
    this._cardsOnTable.push({ cardId: cardId, from: playerId });
    this.players.get(playerId).status = "submitted_card";

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

    const allRight = Array.from(this.votes.entries()).every(([_, votedFor]) => {
      return votedFor === this.storyPlayerId;
    });

    const allWrong = Array.from(this.votes.entries()).every(([_, votedFor]) => {
      return votedFor !== this.storyPlayerId;
    });

    for (const playerId of this.players.keys()) {
      const isStoryTeller = this.storyPlayerId === playerId;
      const guessedStoryteller =
        !isStoryTeller && this.votes.get(playerId) === this.storyPlayerId;

      let addPoints = 0;

      const voteCount = Array.from(this.votes.values()).reduce((acc, curr) => {
        return curr === playerId ? acc + 1 : acc;
      }, 0);

      const votedForThis = Array.from(this.votes.entries()).reduce(
        (acc, curr) => {
          return curr[1] === playerId ? [curr[0], ...acc] : acc;
        },
        []
      );

      if (allRight || allWrong) {
        if (isStoryTeller) {
          addPoints = 0;
        } else {
          addPoints = 2;
        }
      } else if (!isStoryTeller && guessedStoryteller) {
        addPoints = 3;
      } else if (isStoryTeller) {
        addPoints = 3;
      }

      addPoints += voteCount;

      roundScore[playerId] = {
        turn: this.currentTurn,
        scoreBefore: -1,
        score: addPoints,
        reason: allRight
          ? "all_right"
          : allRight
          ? "all_wrong"
          : guessedStoryteller
          ? "story_guessed"
          : "missed",
        votesFrom: votedForThis,
        voteFor: isStoryTeller ? undefined : this.votes.get(playerId),
        wasStoryTelling: isStoryTeller,
      } as ScoreLogEntry;
    }

    this.scores.push(roundScore);
  }

  updateRoomState() {
    const players = Array.from(this.players.values());
    this.game.sendAll(this.id, (p) => ({
      type: "on_room_state_updated",
      payload: {
        roomName: this.name,
        state: {
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
          })),
          scores: this.scores,
          cardsSubmitted:
            this.turnState === "voting"
              ? this._cardsOnTable.map((c) => ({
                  cardId: c.cardId,
                }))
              : ([] as Card[]),
        },
      },
    }));
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
}

function shuffleNewDeck(): Card[] {
  const cards: number[] = [];
  for (let i = 0; i < 55; i++) {
    cards[i] = i;
  }

  const swap = (arr: number[], i: number, j: number) => {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  };

  for (let i = 0; i < 55; i++) {
    const j = Math.floor(Math.random() * 55);
    swap(cards, i, j);
  }
  return cards.map((id) => ({ cardId: id }));
}
