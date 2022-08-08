import React, {createContext, useCallback, useContext, useEffect, useState} from "react";

interface WsContextData {
    ws: WebSocket | null;
    connect: (roomId: string, playerName: string, token: string) => void;
}
class SocketWrapper {
    _ws: WebSocket|null;
    constructor() {
        this._ws = null;
    }
    get ws() {
        return this._ws;
    }
    set ws(value) {
        this._ws = value;
    }
}

const wsWrapper = new SocketWrapper();

enum SocketState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3
};

const defaultData: WsContextData = {
    ws: wsWrapper.ws,
    connect: (): void => {}
}

const WebSocketContext = createContext<WsContextData>(defaultData);
interface WebSocketContextProviderProps {
    children: React.ReactNode;
}

export const WebSocketContextProvider: React.FC<WebSocketContextProviderProps> 
    = ({children}: WebSocketContextProviderProps) => {
    const [isConnected, setIsConnected] = useState<boolean>(false);

    const connect = useCallback((roomId: string, playerName: string, token: string) => {
        if (wsWrapper.ws != null && wsWrapper.ws.readyState !== SocketState.CLOSED) {
            console.log("Already connected: " + wsWrapper.ws.readyState);
            return;
        }
        console.log("Connecting to room " + roomId + " as " + playerName);
        wsWrapper.ws = new WebSocket(
            "ws://localhost:8080/rooms/" + roomId + "?token=" + token + "&playerName=" + playerName);
        setIsConnected(true);
         
    }, [setIsConnected]);

    useEffect(() => {
        return () => {
            console.log("Provider closing socket");
            if (isConnected && wsWrapper.ws) {
                wsWrapper.ws.close();
            }
        }
    }, [isConnected]);
    
    return (
        <WebSocketContext.Provider value={{ws: wsWrapper.ws, connect: connect}}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useSocket = (): WsContextData => {
    const ctx = useContext(WebSocketContext);
    if (!ctx) throw new Error("Must be used in WebSocketContextProvider");
    return ctx;
}