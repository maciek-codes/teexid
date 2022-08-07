import React, { useContext, createContext, useState } from "react";
import { useAuth } from "../hooks/useAuth";

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
    
    // Check local storage
    const storedName = localStorage.getItem("playerName") ?? '';
    const auth = useAuth();

    const [name, setName] = useState<string>(storedName);

    return (
        <PlayerContext.Provider value={{
            id: auth.data?.playerId ?? null,
            name,
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
