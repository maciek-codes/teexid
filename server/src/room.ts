import { v4 as uuidv4 } from "uuid";

import { GameState } from "@teexid/shared";

import { Player } from "./player";
import { Game } from "./game";

export class Room {
  private readonly game: Game;
  private readonly _id: string;
  name: string;
  players: Map<String, Player> = new Map();
  points: Map<String, number> = new Map();
  currentPlayerId: string;
  private _gameState: GameState = "waiting";
  currentTurn: number = 0;

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

  startGame() {
    this._gameState = "playing";
    this.currentTurn = 0;
    this.currentPlayerId = this.players.keys().next().value;
    const currentPlayer = this.players.get(this.currentPlayerId);

    currentPlayer.status = "story_telling";

    this.updateRoomState();
  }

  updateRoomState() {
    this.game.sendAll(this.id, {
      type: "on_room_state_updated",
      payload: {
        roomName: this.name,
        state: {
          gameState: this.gameState,
          players: Array.from(this.players.values()).map((p) => ({
            name: p.name,
            ready: p.ready,
            points: p.points,
            status: p.status,
          })),
        },
      },
    });
  }
}
