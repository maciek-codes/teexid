import React, { createContext, ReactNode, useContext, useState } from "react";
import { useParams } from "react-router-dom";
import Player from "../models/Player";
import { GameStatus, JoinedStatus } from "../models/RoomState";

interface RoomData {
    roomId: string;

    // All players (including current)
    players: Player[]
    // State of the game in this room
    gameStatus: GameStatus,

    joinedStatus: JoinedStatus;

    setPlayers: (val: Player[]) => void;
    setGameStatus: (_: GameStatus) => void;
    setJoinedStatus: (_: JoinedStatus) => void;
}

const noop = () => {};

const defaultRoom: RoomData = {
    roomId: '',
    players: [],
    gameStatus: "waiting",
    joinedStatus: "not_joined",
    setGameStatus: noop,
    setPlayers: noop,
    setJoinedStatus: noop,
}

const RoomContext = createContext<RoomData>(defaultRoom);

type Props = { children: ReactNode };

export const RoomContextProvider: React.FC<Props> = ({children}: Props) => {
    const params = useParams();

    const [players, setPlayers] = useState<Player[]>([]);
    const [gameStatus, setGameStatus] = useState<GameStatus>("waiting");
    const [joinedStatus, setJoinedStatus] = useState<JoinedStatus>("not_joined");
    return (
        <RoomContext.Provider value={{
            roomId: params?.roomId ?? '',
            players,
            gameStatus,
            joinedStatus,
            setPlayers,
            setGameStatus,
            setJoinedStatus,
        }}>
            {children}
        </RoomContext.Provider>
    );
}

export const useRoom = (): RoomData => {
    const ctx = useContext(RoomContext);
    if (!ctx) throw new Error("RoomContextProvider required");
    return ctx;
};