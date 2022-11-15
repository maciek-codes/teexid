import React, { createContext, ReactNode, useCallback, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ResponseMsg } from "../types";
import { useSocket } from "./WebsocketContext";

const RoomContext = createContext<string>('');

type Props = { children: ReactNode };

export const RoomContextProvider: React.FC<Props> = ({children}: Props) => {
    const params = useParams();
    const ws = useSocket();
    const navigate = useNavigate();

    const onMsg = useCallback(({type, payload}: ResponseMsg) => {
        if (type === "error") {
            if (payload.type === "room_not_found") {
                navigate('/');
            }
        }
    }, [navigate]);

    ws.addMsgListener(onMsg);

    useEffect(() => {
        return () => {
            ws.removeMsgListener(onMsg);
        }
    }, [ws, onMsg]);

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
