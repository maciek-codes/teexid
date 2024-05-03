import { Room } from "./room";
import { Client } from "./client";
import { Player } from "./player";
import { GameMessage, JoinRoom } from "../../shared/types/message";
import { logger } from "./logger";

export class Game {
  readonly roomsByRoomId: Map<string, Room> = new Map<string, Room>();
  readonly clients: Map<string, Client[]> = new Map<string, Client[]>();
  readonly players: Map<string, Player> = new Map<string, Player>();
  constructor() {}

  public createRoom(name: string) {
    const room = new Room(name, this);
    this.roomsByRoomId.set(room.id, room);
  }

  public addPlayerClient(client: Client) {
    if (client.getPlayerId() === "") {
      logger.error("Player id is empty", client);
      return;
    }

    if (this.clients.has(client.getPlayerId())) {
      this.clients.get(client.getPlayerId()).push(client);
    } else {
      this.clients.set(client.getPlayerId(), [client]);
    }
    if (!this.players.has(client.getPlayerId())) {
      logger.info("Adding new player ", { playerId: client.getPlayerId() });
      this.players.set(client.getPlayerId(), new Player(client.getPlayerId()));
    }
  }

  public removePlayerClient(client: Client) {
    if (this.clients.has(client.getPlayerId())) {
      const clients = this.clients.get(client.getPlayerId());
      const index = clients.indexOf(client);
      clients.splice(index, 1);
    }
  }

  public handleMessage(msg: GameMessage, client: Client) {
    const playerId = client.getPlayerId();
    const player = this.players.get(playerId);
    switch (msg.type) {
      case "update_name": {
        this.updatePlayerName(playerId, msg.payload.newName);
        this.updatePlayerRoomState(player);
        return;
      }
      case "join_room":
        player.name = msg.payload.playerName;
        this.joinRoom(msg.payload, client);
        return;
      case "mark_ready":
        player.ready = true;
        this.updatePlayerRoomState(player);
        return;
      case "start_game": {
        logger.info("Starting game", player);
        const room = this.findRoom(playerId);
        room.startGame();
        return;
      }
      case "submit_story": {
        logger.info("Got story game", player, msg.payload);
        const room = this.findRoom(playerId);
        room.submitStory(playerId, msg.payload.story, msg.payload.cardId);
        return;
      }
      case "submit_story_card": {
        logger.info("Got story card", player, msg.payload);
        const room = this.findRoom(playerId);
        room.submitStoryCard(playerId, msg.payload.cardId);
        return;
      }
      case "vote": {
        logger.info("Got vote", player, msg.payload);
        const room = this.findRoom(playerId);
        room.vote(playerId, msg.payload.cardId);
        return;
      }
      default:
        break;
    }
  }

  public joinRoom(payload: JoinRoom["payload"], client: Client) {
    // TODO: O(n) -> O(1)
    let room: Room = Array.from(this.roomsByRoomId.values()).find(
      (r) => r.name === payload.roomName
    );

    if (room) {
      logger.info("Found existing room", {
        roomName: payload.roomName,
        roomId: room.id,
      });
    } else {
      room = new Room(payload.roomName, this);
      logger.info("Creating a new room", {
        roomName: payload.roomName,
        roomId: room.id,
      });
      this.roomsByRoomId.set(room.id, room);
    }

    // Find the player
    const player = this.players.get(client.getPlayerId());
    if (room.gameState !== "waiting" && !room.players.has(player.id)) {
      logger.info("New player can't join the room - game started", {
        playerId: player.id,
        roomId: room.id,
      });
      client.send({
        type: "on_join_room",
        payload: { ...payload, success: false },
      });
      return;
    } else if (room.gameState !== "waiting" && room.players.has(player.id)) {
      // Player re-joining the room, send the current state
      logger.info("Player re-joining the room", {
        playerId: player.id,
        roomId: room.id,
      });
      client.send({
        type: "on_join_room",
        payload: { ...payload, success: true },
      });
      player.roomId = room.id;
      room.updateRoomState();
    } else {
      logger.info("Player joining the room", {
        playerId: player.id,
        roomId: room.id,
      });
      // Add player to room, wait for others
      player.roomId = room.id;
      if (!room.players.has(player.id)) {
        room.addPlayer(player);
      }
      client.send({
        type: "on_join_room",
        payload: { ...payload, success: true },
      });
    }
  }

  public send(playerId: string, msg: GameMessage) {
    if (this.clients.has(playerId)) {
      this.clients.get(playerId).forEach((client) => {
        logger.info("Sending message to client", { playerId: playerId }, msg);
        client.send(msg);
      });
    }
  }

  public sendAll(roomId: string, msgFn: (player: Player) => GameMessage) {
    // TODO: Better roomId filter O(n) -> O(1)
    for (const playerId of this.players.keys()) {
      const player = this.players.get(playerId);
      if (roomId === player.roomId) {
        this.send(playerId, msgFn(player));
      }
    }
  }

  private findRoom(playerId: string): Room {
    // TOOD: O(n) -> O(1)
    for (const room of this.roomsByRoomId.values()) {
      if (room.players.has(playerId)) {
        return room;
      }
    }
    logger.error("Player not in any room", { playerId: playerId });
    throw new Error("Player not in any room");
  }

  private updatePlayerName(playerId: string, newName: string) {
    this.players.get(playerId).name = newName;
    this.send(playerId, {
      type: "on_name_updated",
      payload: { name: this.players.get(playerId).name },
    });
  }

  private updatePlayerRoomState(player: Player) {
    const room = this.roomsByRoomId.get(player.roomId);
    if (!room) {
      logger.warn("Player not in any room", {
        playerId: player.id,
        playerRoomId: player.roomId,
      });
    }
    room?.updateRoomState();
  }
}
