import { Server } from "http";
import * as express from "express";
import { WebSocket, WebSocketServer } from "ws";

import { Client } from "./client";
import { Game } from "./game";
import { MessageType } from "@teexid/shared";
import { logger } from "./logger";

logger.info("Server starting");
const host = process.env.HOST || "localhost";
const serverPort = process.env.PORT ?? 8080;

const app = express();

app.get("/", (_, res) => {
  res.status(200).send("Teexit");
});

app.get("/health", (_, res) => {
  res.status(200).send("healthy");
});

const server = new Server(app);

const wss = new WebSocketServer({ server, path: "/ws" });

const clients = new Map<WebSocket, Client>();
const game = new Game();

export const runServer = () => {
  wss.on("connection", (ws, req) => {
    logger.info("connection");

    if (!clients.has(ws)) {
      clients.set(ws, new Client(ws, game));
    } else {
      game.updatePlayerRoomState(clients.get(ws)?.playerId);
    }

    ws.on("error", (err) => logger.error("Socker error", err));

    ws.on("close", (close) => {
      logger.info("closing", close);
      clients.get(ws)?.close();
      clients.delete(ws);
    });

    ws.on("message", (data: Buffer) => {
      const message = data.toString();
      const parsed = JSON.parse(message) as MessageType;
      clients.get(ws)?.handleMessage(parsed);
    });
  });

  server.listen(serverPort, () => {
    logger.info(`Server started on port ${host}:${serverPort}`);
  });
};
