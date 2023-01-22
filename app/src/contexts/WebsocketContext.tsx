import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getRoomToken } from "../hooks/useAuth";
import { ResponseMsg } from "../types";
import { getWsHost } from "../utils/config";
import { useRoom } from "./RoomContext";

const SOCKET_HOST = getWsHost();
const PING_SECS = 10;
const NO_PONG_MAX_SECS = 45;

interface SocketContextData {
  connecting: boolean;
  connected: boolean;
  error: Error | null;
}
const WebSocketContext = createContext<SocketContextData | null>(null);

interface WebSocketContextProviderProps {
  children: React.ReactNode;
}

let lastPongTimestamp = 0;
export const WebSocketContextProvider: React.FC<
  WebSocketContextProviderProps
> = ({ children }: WebSocketContextProviderProps) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(ws?.readyState === WebSocket.OPEN);
  const [connecting, setConnecting] = useState(
    ws?.readyState !== WebSocket.OPEN
  );

  useEffect(() => {
    if (ws == null) {
      setWs(new WebSocket(SOCKET_HOST + "?token=" + getRoomToken()));
    }
  }, [ws, setWs]);

  const [error, setError] = useState<Error | null>(
    ws?.readyState === WebSocket.CLOSED
      ? new Error("Couldn't connect to the server")
      : null
  );

  const { dispatch } = useRoom();

  // Monitor connection state
  useEffect(() => {
    const timeoutId = setInterval(() => {
      const connectedState = ws?.readyState ?? -1;
      if (connectedState === WebSocket.OPEN) {
        if (
          lastPongTimestamp > 0 &&
          lastPongTimestamp < Date.now() - NO_PONG_MAX_SECS * 1000
        ) {
          setConnected(false);
          setConnected(false);
          ws?.close();
        } else {
          setConnecting(false);
          setConnected(true);
        }
      } else if (connectedState === WebSocket.CONNECTING) {
        setConnected(false);
        setConnecting(true);
      } else {
        setConnected(false);
        setConnected(false);
      }
    }, 2000);
    return () => {
      clearInterval(timeoutId);
    };
  });

  // Try to reconnnect
  useEffect(() => {
    const intervalId = setInterval(() => {
      const readyState = ws?.readyState ?? -1;
      if (readyState !== WebSocket.OPEN) {
        console.warn(`Socket not in open state: ${readyState}`);
        setConnected(false);
        setConnecting(true);
        setWs(new WebSocket(getWsHost() + "?token=" + getRoomToken()));
      } else if (readyState === WebSocket.OPEN) {
        ws?.send(JSON.stringify({ type: "ping" }));
      }
    }, PING_SECS * 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [ws, setWs]);

  const onMsg = useCallback(
    (ev: MessageEvent<string>) => {
      const msg = JSON.parse(ev.data) as ResponseMsg;
      if (msg.type === "pong") {
        console.log("Pong");
        setError(null);
        lastPongTimestamp = Date.now();
        return;
      } else {
        dispatch(msg);
      }
    },
    [setError, dispatch]
  );

  useEffect(() => {
    if (!ws) {
      return;
    }
    ws.addEventListener("message", onMsg);
    const onMsgRef = onMsg;
    const websocketRef = ws;
    return () => {
      websocketRef.removeEventListener("message", onMsgRef);
    };
  }, [ws, onMsg]);

  const onError = useCallback(
    (ev: Event) => {
      setError(new Error("Socket error!"));
    },
    [setError]
  );

  const onOpen = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (!ws) return;
    ws.addEventListener("error", onError);
    ws.addEventListener("open", onOpen);
    const thisOnError = onError;
    const thisOnOpen = onOpen;
    return () => {
      ws.removeEventListener("error", thisOnError);
      ws.removeEventListener("open", thisOnOpen);
    };
  }, [ws, onOpen, onError]);

  return (
    <WebSocketContext.Provider
      value={{
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
