import React, { createContext, ReactNode, useContext } from "react";
import { useParams } from "react-router-dom";

const RoomContext = createContext<string>('');

type Props = { children: ReactNode };

export const RoomContextProvider: React.FC<Props> = ({children}: Props) => {
    const params = useParams();

    return (
        <RoomContext.Provider value={params?.roomId ?? ''}>
            {children}
        </RoomContext.Provider>
    );
}

export const useRoom = (): string => {
    const ctx = useContext(RoomContext);
    if (!ctx) throw new Error("RoomContextProvider required");
    return ctx;
};
