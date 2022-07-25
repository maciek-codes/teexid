import React, { useContext, createContext, useState, useCallback } from "react";
import Player from "../models/Player";

interface PlayerData {
    id: string | null;
    name: string | null;
    setName: (name: string) => void;
}

const PlayerContext = createContext<PlayerData | null>(null);

type Props = {
    children: React.ReactNode;
}

export const PlayerContextProvider: React.FC<Props> = ({children}: Props) => {
    const [player, setPlayer] = useState<Player>({
        id: "",
        name: "", 
        ready: false});
    const setName = useCallback((name: string) => {
        const newPlayer: Player = {
            ...player ?? {},
            name
        };
        setPlayer(newPlayer);
    }, [player, setPlayer]);
    return (
        <PlayerContext.Provider value={{
            id: player?.id ?? null,
            name: player?.name ?? null,
            setName,
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export const usePlayer = (): PlayerData => {
    const ctx = useContext(PlayerContext);
    if (!ctx) throw new Error("PlayerContextProvider needed");
    return ctx;
}
