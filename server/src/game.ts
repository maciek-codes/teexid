import { Room } from "./room";
import { Client } from "./client";
import { Player } from "./player";
import { GameMessage, JoinRoom } from "../../shared/types/message";
import { logger } from "./logger";

export class Game {
  private readonly rooms: Map<string, Room> = new Map<string, Room>();
  private readonly clients: Map<string, Client[]> = new Map<string, Client[]>();
  private readonly players: Map<string, Player> = new Map<string, Player>();
  constructor() {}

  public createRoom(name: string) {
    const room = new Room(name, this);
    this.rooms.set(room.id, room);
  }

  public addPlayerClient(client: Client) {
    if (this.clients.has(client.getPlayerId())) {
      this.clients.get(client.getPlayerId()).push(client);
    } else {
      this.clients.set(client.getPlayerId(), [client]);
    }
    if (!this.players.has(client.getPlayerId())) {
      logger.info("Adding new player ", client.getPlayerId());
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
        this.updatePlayersList(player.roomId);
        return;
      }
      case "join_room":
        player.name = msg.payload.playerName;
        this.joinRoom(msg.payload, client);
        return;
      case "mark_ready":
        player.ready = true;
        this.updatePlayersList(player.roomId);
        return;
      case "start_game":
        logger.info("Starting game", player);

        // TODO: how do we handle this?
        const room = Array.from(this.rooms.values()).find(
          (r) => r.id === player.roomId
        );
        room.startGame();
        return;
      default:
        break;
    }
  }

  public joinRoom(payload: JoinRoom["payload"], client: Client) {
    let room: Room;
    if (this.rooms.has(payload.roomName)) {
      room = this.rooms.get(payload.roomName);
    } else {
      room = new Room(payload.roomName, this);
      this.rooms.set(payload.roomName, room);
    }

    const player = this.players.get(client.getPlayerId());

    if (room.gameState !== "waiting" && !room.players.has(player.id)) {
      client.send({
        type: "on_join_room",
        payload: { ...payload, success: false },
      });
      return;
    } else {
      player.roomId = room.id;
      if (!room.players.has(player.id)) {
        room.addPlayer(player);
      }
    }

    client.send({
      type: "on_join_room",
      payload: { ...payload, success: true },
    });

    this.updatePlayersList(room.id);
  }

  public send(playerId: string, msg: GameMessage) {
    if (this.clients.has(playerId)) {
      this.clients.get(playerId).forEach((client) => {
        logger.info("Sending message to client", playerId, msg);
        client.send(msg);
      });
    }
  }

  public sendAll(roomId: string, msg: GameMessage) {
    // TODO: Better roomId filter O(n) -> O(1)
    for (const playerId of this.players.keys()) {
      if (roomId === this.players.get(playerId).roomId) {
        this.send(playerId, msg);
      }
    }
  }

  private updatePlayerName(playerId: string, newName: string) {
    this.players.get(playerId).name = newName;
    this.send(playerId, {
      type: "on_name_updated",
      payload: { name: this.players.get(playerId).name },
    });
  }

  private updatePlayersList(roomId: string) {
    this.sendAll(roomId, {
      type: "on_players_list_updated",
      payload: {
        players: Array.from(this.players.values())
          .filter((p) => p.roomId === roomId)
          .map((p) => ({
            name: p.name,
            points: p.points,
            ready: p.ready,
            status: p.status,
          })),
      },
    });
  }
}
