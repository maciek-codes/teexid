import { GameMessage, JoinRoom } from "@teexid/shared";

import { Client } from "./client";
import { logger } from "./logger";
import { Player } from "./player";
import { Room } from "./room";

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
    if (client.playerId === "") {
      logger.error("Player id is empty", client);
      return;
    }

    if (this.clients.has(client.playerId)) {
      this.clients.get(client.playerId).push(client);
    } else {
      this.clients.set(client.playerId, [client]);
    }
    if (!this.players.has(client.playerId)) {
      logger.info("Adding new player ", { playerId: client.playerId });
      this.players.set(client.playerId, new Player(client.playerId));
    }
  }

  public removePlayerClient(client: Client) {
    if (this.clients.has(client.playerId)) {
      const clients = this.clients.get(client.playerId);
      const index = clients.indexOf(client);
      clients.splice(index, 1);
    }
  }

  public handleMessage(msg: GameMessage, client: Client) {
    const playerId = client.playerId;
    const player = this.players.get(playerId);
    const room = this.roomsByRoomId.get(player.roomId)
      ? this.roomsByRoomId.get(player.roomId)
      : null;
    switch (msg.type) {
      case "update_name": {
        this.updatePlayerName(playerId, msg.payload.newName);
        this.updatePlayerRoomState(playerId);
        return;
      }
      case "join_room":
        logger.info("Join room", {
          playerId: playerId,
          roomName: msg.payload.roomName,
        });
        player.name = msg.payload.playerName;
        this.joinRoom(msg.payload, client);
        return;
      case "mark_ready":
        if (room) {
          room.markReady(playerId);
          this.updatePlayerRoomState(playerId);
        } else {
          // Send error message
          client.send({
            type: "error",
            payload: { code: "room_not_found", message: "No room found" },
          });
        }
        return;
      case "start_game": {
        if (room) {
          logger.info("Starting game", { playerId: playerId, roomId: room.id });
          room.startTurn();
        } else {
          // Send error message
          client.send({
            type: "error",
            payload: { code: "room_not_found", message: "No room found" },
          });
        }
        return;
      }
      case "restart_game": {
        if (room) {
          logger.info("Restarting game", {
            playerId: playerId,
            roomId: room.id,
          });
          room.restartTurn();
        } else {
          // Send error message
          client.send({
            type: "error",
            payload: { code: "room_not_found", message: "No room found" },
          });
        }
        return;
      }
      case "submit_story": {
        logger.info("Got story", {
          playerId: player.id,
          roomId: room.id,
          story: msg.payload.story,
        });
        room?.submitStory(playerId, msg.payload.story, msg.payload.cardId);
        return;
      }
      case "submit_story_card": {
        logger.info("Got story card", {
          playerId: player.id,
          roomId: room.id,
          cardId: msg.payload.cardId,
        });
        room?.submitStoryCard(playerId, msg.payload.cardId);
        return;
      }
      case "vote": {
        logger.info("Got vote", {
          playerId: player.id,
          roomId: room.id,
          voteFor: msg.payload.cardId,
        });
        room?.vote(playerId, msg.payload.cardId);
        return;
      }
      default:
        break;
    }
  }

  public joinRoom(payload: JoinRoom["payload"], client: Client) {
    // TODO: O(n) -> O(1)
    let room: Room = Array.from(this.roomsByRoomId.values()).find(
      (r) => r.name === payload.roomName,
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
    const player = this.players.get(client.playerId);
    if (
      room.gameState !== "waiting" &&
      !room.playerIds.find((pid) => pid === player.id)
    ) {
      logger.info("New player can't join the room - game started", {
        playerId: player.id,
        roomId: room.id,
      });
      client.send({
        type: "on_join_room",
        payload: { ...payload, success: false },
      });
      return;
    } else if (
      room.gameState !== "waiting" &&
      room.playerIds.find((pid) => pid === player.id)
    ) {
      player.roomId = room.id;
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
      player.ready = false;
      if (!room.playerIds.find((pid) => pid === player.id)) {
        room.addPlayer(player);
      }
      client.send({
        type: "on_join_room",
        payload: { ...payload, success: true },
      });
      room.updateRoomState();
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

  public sendAll(
    roomId: string,
    msgFn: (player: Player) => GameMessage | null,
  ) {
    // TODO: Better roomId filter O(n) -> O(1)
    for (const playerId of this.players.keys()) {
      const player = this.players.get(playerId);
      if (roomId === player.roomId) {
        const message = msgFn(player);
        if (message) {
          this.send(playerId, message);
        }
      }
    }
  }

  private updatePlayerName(playerId: string, newName: string) {
    this.players.get(playerId).name = newName;
    const room = this.roomsByRoomId.get(this.players.get(playerId).roomId);
    room?.updatePlayerName(playerId, newName);
    this.send(playerId, {
      type: "on_name_updated",
      payload: { name: this.players.get(playerId).name },
    });
  }

  public updatePlayerLastSeen(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      const room = this.roomsByRoomId.get(player.roomId);
      if (room) {
        room.updateLastSeen(playerId);
      }
    }
  }

  public updatePlayerRoomState(playerId: string) {
    const player = this.players.get(playerId);
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
