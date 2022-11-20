import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "../hooks/useAuth";
import { ResponseMsg } from "../types";
import { getWsHost } from "../utils/config";

const SOCKET_HOST = getWsHost();

let ws: WebSocket | null = null;
const getWs = () => {
  if (ws == null) {
    ws = new WebSocket(SOCKET_HOST);
  }
  return ws;
};

const getReadyState = (): number => {
  const socket = getWs();
  return socket.readyState;
};

type CreateRoomCommandData = { playerName: string };
type JoinCommandData = { roomId: string; playerName: string };
type RoomCommandData = { roomId: string };
type StoryCommandData = { roomId: string; story: string; cardId: number };
type CardCommandData = { roomId: string; cardId: number };
type Command =
  | { type: "create_room"; data: CreateRoomCommandData }
  | { type: "join_room"; data: JoinCommandData }
  | { type: "game/start"; data: RoomCommandData }
  | { type: "player/ready"; data: RoomCommandData }
  | { type: "player/story"; data: StoryCommandData }
  | { type: "player/submitCard"; data: CardCommandData }
  | { type: "player/vote"; data: CardCommandData };

type CallbackFn = (msg: ResponseMsg) => void;

interface SocketContextData {
  sendCommand: (cmd: Command) => void;
  addMsgListener: (fn: CallbackFn) => void;
  removeMsgListener: (fn: CallbackFn) => void;
  connecting: boolean;
  connected: boolean;
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

  const [connected, setConnected] = useState(
    getReadyState() === WebSocket.OPEN
  );
  const [connecting, setConnecting] = useState(
    getReadyState() !== WebSocket.OPEN
  );

  const [error, setError] = useState<Error | null>(
    getReadyState() === WebSocket.CLOSED
      ? new Error("Couldn't connect to the server")
      : null
  );

  const addMsgListener = useCallback((fn: CallbackFn) => {
    listeners = [...listeners, fn];
  }, []);

  const removeMsgListener = useCallback((fn: CallbackFn) => {
    listeners = listeners.filter((listener) => listener !== fn);
  }, []);

  useEffect(() => {
    const timeoutId = setInterval(() => {
      if (connected && getReadyState() !== WebSocket.OPEN) {
        setConnected(false);
        setConnecting(true);
      } else if (!connected) {
        setConnected(true);
        setConnecting(false);
      }
    });
    return () => {
      clearInterval(timeoutId);
    };
  });

  useEffect(() => {
    const timeoutId = setInterval(() => {
      if (getReadyState() === WebSocket.CLOSED) {
        setConnected(false);
        setConnecting(true);
        ws = new WebSocket(SOCKET_HOST);
      }
    }, 10000);
    return () => {
      clearInterval(timeoutId);
    };
  }, []);

  const onMsg = useCallback((ev: MessageEvent<string>) => {
    const msg = JSON.parse(ev.data) as ResponseMsg;
    listeners.forEach((listener) => listener(msg));
  }, []);

  useEffect(() => {
    getWs().addEventListener("message", onMsg);
    const onMsgRef = onMsg;
    const websocketRef = getWs();
    return () => {
      websocketRef.removeEventListener("message", onMsgRef);
    };
  }, [onMsg]);

  const sendCommand = useCallback(
    ({ type, data }: Command) => {
      if (getReadyState() !== getWs().OPEN) {
        return;
      }
      console.log("command: " + type + " auth: " + auth.data);
      getWs().send(
        JSON.stringify({
          token: auth.data?.token,
          type: type,
          data: JSON.stringify(data),
        })
      );
    },
    [auth]
  );

  const onError = useCallback(
    (ev: Event) => {
      setError(new Error("Socket error!"));
    },
    [setError]
  );

  useEffect(() => {
    getWs().addEventListener("error", onError);
    const thisOnError = onError;
    return () => {
      getWs().removeEventListener("error", thisOnError);
    };
  }, [onError]);

  return (
    <WebSocketContext.Provider
      value={{
        sendCommand,
        addMsgListener,
        removeMsgListener,
        error,
        connected,
        connecting,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useSocket = (): SocketContextData => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("Must be used in WebSocketContextProvider");
  return ctx;
};
