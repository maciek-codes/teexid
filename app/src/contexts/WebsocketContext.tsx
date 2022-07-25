import React, { createContext, ReactElement, useContext, useMemo, useState } from "react";
import { useRoom } from "./RoomContext";

interface WebsocketContextData {
    webSocket: WebSocket | null;
    sendWs: (msg: string) => void;
}

const WebsocketContext = createContext<WebsocketContextData | null>(null);

type Props = {children: ReactElement}
export const WebSocketContextProvider: React.FC<Props> = ({ children }: Props) => {

    const { roomId } = useRoom();
    
    const webSocket = useMemo<WebSocket | null>(() => {
        if (roomId) {
            return new WebSocket(
                'ws://localhost:8080/rooms/'
                + roomId);
        } else {
            return null;
        }
    }, [roomId]);

    const sendWs = (msg: string) => {
        webSocket?.send(msg);
    }

    useMemo(() => {
        if (!webSocket) {
            return;
        }
        webSocket.onopen = (ev: Event) => {
            console.log("Connected to the room.");
        };
        webSocket.onerror = (ev: Event) => {
            console.error(ev);
        }
        webSocket.onclose = (ev: Event) => {
            console.log("Closing");
        }
    }, [webSocket]);

    return (
        <WebsocketContext.Provider value={{
            webSocket,
            sendWs
        }}>
            {children}
        </WebsocketContext.Provider>
    )
}

export const useSocket = (): WebsocketContextData => {
    const ctx = useContext(WebsocketContext);
    if (!ctx) {
        throw new Error("Use in WebsocketContextProvider");
    }
    return ctx;
}
