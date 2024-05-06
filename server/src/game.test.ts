import { Game } from "./game";
import { Client } from "./client";
import { WebSocket } from "ws";

describe("Game", () => {
  describe("createRoom", () => {
    it("should create a room", () => {
      const game = new Game();
      game.createRoom("test");
      expect(game.roomsByRoomId.size).toBe(1);
    });
  });

  describe("addPlayerClient", () => {
    let game: Game;
    beforeEach(() => {
      game = new Game();
      game.createRoom("test");
    });
    it("should add a player client", () => {
      const ws = jest.mocked(
        new WebSocket("ws://localhost:8080/ws", { timeout: 3000 }),
      );
      const client = new Client(ws, game);
      client.handleMessage({ type: "identify", payload: { playerId: "1" } });
      game.addPlayerClient(client);
      expect(game.clients.size).toBe(1);

      const ws2 = jest.mocked(new WebSocket("ws://localhost:8080/ws"));
      const client2 = new Client(ws2, game);
      client2.handleMessage({ type: "identify", payload: { playerId: "2" } });
      game.addPlayerClient(client2);
      expect(game.clients.size).toBe(2);
    });

    it("should add a player client only wonce", () => {
      const ws = jest.mocked(new WebSocket("ws://localhost:8080/ws"));
      const client = new Client(ws, game);

      client.handleMessage({ type: "identify", payload: { playerId: "1" } });
      game.addPlayerClient(client);
      expect(game.clients.size).toBe(1);

      // Client reconnected, new socket
      const ws2 = jest.mocked(new WebSocket("ws://localhost:8080/ws"));
      const client2 = new Client(ws2, game);
      client2.handleMessage({ type: "identify", payload: { playerId: "1" } });
      game.addPlayerClient(client2);
      expect(game.clients.size).toBe(1);
    });
  });
});
