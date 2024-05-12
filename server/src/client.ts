import { GameMessage, MessageType } from "@teexid/shared";
import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";

import { logger } from "./logger";
import { Game } from "./game";

export class Client {
  private ws: WebSocket | null;
  // Represents the unique identifier for the websocket connection
  private readonly uuid: string;
  private readonly game: Game;

  // Represents the unique identifier for the player
  // Player can have multiple connections
  private _playerId: string;
  public get playerId(): string {
    return this._playerId;
  }
  private set playerId(v: string) {
    this._playerId = v;
  }

  constructor(ws: WebSocket, game: Game) {
    this.uuid = uuidv4();
    this.ws = ws;
    this.game = game;
  }

  public send(message: MessageType) {
    this.ws?.send(JSON.stringify(message));
  }

  public handleMessage(msg: MessageType) {
    if (msg.type === "ping") {
      if (this.playerId !== "") {
        this.game.updatePlayerLastSeen(this.playerId);
      }
      this.send({ type: "pong" });
    } else if (msg.type === "identify") {
      this.playerId = msg.payload.playerId;
      this.game.addPlayerClient(this);
    } else {
      if (this.playerId === "") {
        this.send({
          type: "error",
          payload: {
            code: "identify_required",
            message: "You need to identify first",
          },
        });
        return;
      }

      logger.info("handling message", {
        type: msg.type,
        payload: ("payload" in msg && msg?.payload) ?? {},
      });

      this.game.handleMessage(msg as GameMessage, this);
    }
  }

  public setWs(ws: WebSocket) {
    this.ws = ws;
  }

  public close() {
    this.game.removePlayerClient(this);
  }
}
