import { useEffect, useState } from "react";
import { getRoomToken } from "../hooks/useAuth";
import { ResponseMsg } from "../types";
import { getWsHost } from "../utils/config";
import { useRoomStore } from "../stores/RoomStore";

const SOCKET_HOST = getWsHost();
const PING_SECS = 10;
const NO_PONG_MAX_SECS = 45;

type ConnectionState = "not_connected" | "connecting" | "connected";

export const useWebsocket = () => {
  const { roomId, handleRoomCommand } = useRoomStore();
  const [connState, setConnState] = useState<ConnectionState>("not_connected");
  useEffect(() => {
    let ws: WebSocket | null = null;
    let lastPongTimestamp = 0;

    const onMessage = (ev: MessageEvent<string>) => {
      const msg = JSON.parse(ev.data) as ResponseMsg;
      if (msg.type === "pong") {
        console.log("Pong");
        lastPongTimestamp = Date.now();
        return;
      } else {
        handleRoomCommand(msg);
      }
    };

    const onOpen = () => {
      setConnState("connected");
    };

    const onClose = () => {
      setConnState("not_connected");
    };

    if (roomId !== "") {
      setConnState("connecting");
      ws = new WebSocket(SOCKET_HOST + "?token=" + getRoomToken());
      ws.onopen = onOpen;
      ws.onmessage = onMessage;
      ws.close = onClose;
    }

    // Try to reconnnect
    const intervalId = setInterval(() => {
      const readyState = ws?.readyState ?? -1;
      if (readyState !== WebSocket.OPEN) {
        console.warn(`Socket not in open state: ${readyState}`);
        setConnState("connecting");
        ws = new WebSocket(getWsHost() + "?token=" + getRoomToken());
        ws.onopen = onOpen;
        ws.onmessage = onMessage;
        ws.close = onClose;
      } else if (readyState === WebSocket.OPEN) {
        if (
          lastPongTimestamp > 0 &&
          lastPongTimestamp < Date.now() - NO_PONG_MAX_SECS * 1000
        ) {
          ws?.close();
        } else {
          ws?.send(JSON.stringify({ type: "ping" }));
        }
      }
    }, PING_SECS * 1000);

    return () => {
      if (ws) {
        ws.close();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [roomId, handleRoomCommand]);

  return {
    connState,
  };
};
