import React, {createContext, useCallback, useContext} from "react";
import { useAuth } from "../hooks/useAuth";

const ws = new WebSocket("ws://localhost:8080/ws");

type CommandType = "join_room" |
    "create_room" |
    "get_players" |
    "player/ready" |
    "player/story" |
    "game/start"
    ;

interface SocketContextData {
    ws: WebSocket;
    sendCommand: (type: CommandType, data: any) => void;
}
const WebSocketContext = createContext<SocketContextData | null>(null);

interface WebSocketContextProviderProps {
    children: React.ReactNode;
}

export const WebSocketContextProvider: React.FC<WebSocketContextProviderProps> 
    = ({children}: WebSocketContextProviderProps) => {

    const auth = useAuth();
    const sendCommand = useCallback((type: CommandType, data: any) => {
        if (ws.readyState !== ws.OPEN) {
            return;
        }
        ws.send(JSON.stringify({
            token: auth.data?.token,
            type: type,
            data: JSON.stringify(data)
        }));
    }, [auth]);
    
    return (
        <WebSocketContext.Provider value={{ws, sendCommand}}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useSocket = (): SocketContextData => {
    const ctx = useContext(WebSocketContext);
    if (!ctx) throw new Error("Must be used in WebSocketContextProvider");
    return ctx;
}