import Player from "./Player";

export interface SocketResponse<Payload> {
    type: string;
    payload: Payload;
};

type JoinData = {
    joined: boolean,
    roomId: string,
    ownerId: string,
    playerId: string,
};

type PlayerUpdatedData = {
    players: Array<Player>
}

export interface JoinReponse extends SocketResponse<JoinData> {};
export interface PlayersUpdatedResposne extends SocketResponse<PlayerUpdatedData> {};

export const isJoinResponse = (r: SocketResponse<unknown>): r is JoinReponse => {
    return r.type === 'onjoined';
}

export const isPlayerUpatedResponse = (r: SocketResponse<unknown>): r is PlayersUpdatedResposne => {
    return r.type === 'onplayersupdated';
}
