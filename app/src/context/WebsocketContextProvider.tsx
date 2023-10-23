import React, {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
} from "react";

import { MessageType } from "@teexid/shared";

import { getWsHost } from "../utils/config";
import { useGameStore } from "../stores/GameStore";

type WebsocketContextType = {
  send: (message: MessageType) => void;
};

let ws: WebSocket | null;
const WebsocketContext = createContext<WebsocketContextType | null>({
  send: (message: MessageType) => {
    throw new Error("WebsocketContext not initialized");
  },
});

const RECONNECT_INTERVAL_MS = 2_000;

export const WebsocketContextProvider = ({
  children,
}: {
  children: ReactElement;
}): JSX.Element => {
  const [isConnected, setConnected, onAction, playerId] = useGameStore(
    (state) => [
      state.isConnected,
      state.setConnected,
      state.onAction,
      state.playerId,
    ]
  );

  const onConnect = useCallback(() => {
    setConnected(true);
    ws?.send(JSON.stringify({ type: "identify", payload: { playerId } }));
  }, [setConnected]);

  const onMsg = useCallback((msg: MessageEvent<string>) => {
    const payload = JSON.parse(msg.data);
    console.log("onMsg", payload);
    onAction(payload as MessageType);
  }, []);

  const onClose = useCallback(
    (msg: CloseEvent) => {
      console.log("onClose", msg);
      setConnected(false);
    },
    [setConnected]
  );

  const connect = () => {
    ws = new WebSocket(getWsHost());
    ws.addEventListener("open", onConnect);
    ws.addEventListener("message", onMsg);
    ws.addEventListener("close", onClose);
    ws.addEventListener("error", onError);
  };

  const disconnect = () => {
    ws?.removeEventListener("open", onConnect);
    ws?.removeEventListener("message", onMsg);
    ws?.removeEventListener("close", onClose);
    ws?.removeEventListener("error", onError);
    if (ws?.readyState == WebSocket.OPEN) {
      ws?.close();
    }
  };

  // Log errors
  const onError = useCallback((e: Event) => {
    console.error("WS error", JSON.stringify(e));
  }, []);

  const sendMessageToSocket = useCallback((msg: MessageType) => {
    if (ws && ws?.readyState === WebSocket.OPEN) {
      console.log("sending", msg);
      ws?.send(JSON.stringify(msg));
    } else {
      console.error("WS not connected: " + ws?.readyState ?? "unknown");
    }
  }, []);

  useEffect(() => {
    // Connect on mount
    connect();
    // Monitor the connection, reconnect if necessary
    const timeout = setInterval(() => {
      if (ws?.readyState !== WebSocket.OPEN) {
        disconnect();
        connect();
      }
    }, RECONNECT_INTERVAL_MS);

    return () => {
      clearInterval(timeout);
      disconnect();
    };
  }, []);

  return (
    <WebsocketContext.Provider
      value={{
        connected: isConnected,
        send: sendMessageToSocket,
      }}
    >
      {children}
    </WebsocketContext.Provider>
  );
};

export const useWebsocketContext = (): WebsocketContextType => {
  const ctx = useContext(WebsocketContext);
  if (!ctx) {
    throw new Error(
      "useWebsocket must be used within a WebsocketContextProvider"
    );
  }

  return ctx;
};
