import { logger } from "./logger";
import { GameMessage, MessageType } from "../../shared/types/message";
import { Game } from "./game";
import { v4 as uuidv4 } from "uuid";

import { WebSocket } from "ws";

export class Client {
  private ws: WebSocket | null;
  // Represents the unique identifier for the websocket connection
  private readonly uuid: string;
  private readonly game: Game;

  // Represents the unique identifier for the player
  // Player can have multiple connections
  private playerId: string;
  private lastSeen: Date;

  constructor(ws: WebSocket, game: Game) {
    this.uuid = uuidv4();
    this.ws = ws;
    this.lastSeen = new Date();
    this.game = game;
  }

  public send(message: MessageType) {
    this.ws?.send(JSON.stringify(message));
  }

  public handleMessage(msg: MessageType) {
    logger.info("handling message", msg);
    if (msg.type === "ping") {
      this.lastSeen = new Date();
      this.send({ type: "pong" });
    } else if (msg.type === "identify") {
      this.playerId = msg.payload.playerId;
      this.game.addPlayerClient(this);
    } else {
      if (this.getPlayerId() === "") {
        this.send({
          type: "error",
          payload: "You must identify yourself first",
        });
        return;
      }

      this.game.handleMessage(msg as GameMessage, this);
    }
  }

  public setWs(ws: WebSocket) {
    this.ws = ws;
  }

  public close() {
    this.game.removePlayerClient(this);
  }

  public getPlayerId() {
    return this.playerId;
  }
}
