import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { ResponseMsg } from "../types";

const SOCKET_HOST = "ws://localhost:8080/ws";

let ws = new WebSocket(SOCKET_HOST);

type CommandType =
  | "join_room"
  | "create_room"
  | "get_players"
  | "game/start"
  | "player/ready"
  | "player/story"
  | "player/submitCard"
  | "player/vote";

type CallbackFn = (type: string, payload: unknown) => void;

interface SocketContextData {
  ws: WebSocket;
  sendCommand: (type: CommandType, data: any) => void;
  addMsgListener: (fn: CallbackFn) => void;
  removeMsgListener: (fn: CallbackFn) => void;
  error: Error | null;
}
const WebSocketContext = createContext<SocketContextData | null>(null);

interface WebSocketContextProviderProps {
  children: React.ReactNode;
}

let listeners: CallbackFn[] = [];

export const WebSocketContextProvider: React.FC<
  WebSocketContextProviderProps
> = ({ children }: WebSocketContextProviderProps) => {
  const auth = useAuth();
  const [error, setError] = useState<Error | null>(ws.readyState === ws.CLOSED ?
    new Error("Couldn't connect to the server") : null);

  const addMsgListener = useCallback((fn: CallbackFn) => {
    listeners = [...listeners, fn];
  }, []);

  const removeMsgListener = useCallback((fn: CallbackFn) => {
    listeners = listeners.filter(listener => listener !== fn);
  }, [])

  useEffect(() => {
    const timeoutId = setInterval(() => {
      if (ws.readyState === ws.CLOSED) {
        ws = new WebSocket(SOCKET_HOST);
      }
    }, 10000);
    return () => {
      clearInterval(timeoutId);
    }
  }, []);

  const onMsg = useCallback((ev: MessageEvent<any>) => {
    const msg = JSON.parse(ev.data) as ResponseMsg<unknown>;
    listeners.forEach(listener => listener(msg.type, msg.payload));
  }, []);

  useEffect(() => {
    ws.addEventListener('message', onMsg);
    const onMsgRef = onMsg;
    const websocketRef = ws;
    return () => {
      websocketRef.removeEventListener('message', onMsgRef);
    }
  }, [onMsg]);

  const sendCommand = useCallback(
    (type: CommandType, data: any) => {
      if (ws.readyState !== ws.OPEN) {
        return;
      }
      ws.send(
        JSON.stringify({
          token: auth.data?.token,
          type: type,
          data: JSON.stringify(data),
        })
      );
    },
    [auth]
  );

  const onError = useCallback((ev: Event) => {
    setError(new Error("Socket error!"));
  }, [setError]);

  useEffect(() => {
    ws.addEventListener('error', onError)
    const thisOnError = onError;
    return () => {
      ws.removeEventListener('error', thisOnError);
    }
  }, [onError]);

  return (
    <WebSocketContext.Provider value={
      { ws, sendCommand, addMsgListener, removeMsgListener, error }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useSocket = (): SocketContextData => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("Must be used in WebSocketContextProvider");
  return ctx;
};
