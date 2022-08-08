import { useCallback, useEffect, useState } from "react";

import {useRoom} from '../contexts/RoomContext';
import {usePlayer} from '../contexts/PlayerContext';
import { isJoinResponse, isPlayerUpatedResponse, SocketResponse } from "../models/SocketResponse";
import { useAuth } from "./useAuth";
import { useSocket } from "../contexts/WebsocketContext";

interface JoinRoomAction {
  connect: (roomId: string) => void;
  isConnecting: boolean;
  isJoined: boolean;
  error: Error | null;
}

export const useJoinRoom = (): JoinRoomAction => {
    const room = useRoom();
    const player = usePlayer();
    const { connect, ws } = useSocket();
    const auth = useAuth();
    const token = auth.data?.token;
    const [error, setError] = useState<Error | null>(null);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isJoined, setIsJoined] = useState<boolean>(false);

    const onOpen = () => {
      setIsConnecting(false);
      setIsJoined(true);
    }

    const onMessage = useCallback((event: MessageEvent<string>) => {
      const msg = JSON.parse(event.data) as SocketResponse<unknown>;
      if (isPlayerUpatedResponse(msg)) {
        const payload = msg.payload;
        room.setPlayers(payload.players)
      }
      else if (isJoinResponse(msg)) {
        const payload = msg.payload;
        if (payload.joined) {
          room.setJoinedStatus("joined")
        }
      }
    }, [room]);

    const onError = useCallback((ev: Event) => {
      if (ev instanceof ErrorEvent) {
        const errorEv = ev as ErrorEvent;
        setError(new Error(errorEv.message));
      } else {
        setError(new Error("Connection error."));
      }
      setIsJoined(false);
      setIsConnecting(false);
      
    }, [setError]);

    const onClose = useCallback((evt: CloseEvent) => {
      if (evt.code !== 1000) {
        setError(new Error("Couldn't join the room"));
        setIsJoined(false);
        setIsConnecting(false);
      }
    }, [setError]);
   
    // Connect if needed
    const connectToRoom = useCallback((roomId: string) => {
      if (roomId.trim() === "" || !token || !player.name) {
        return;
      }
      setIsConnecting(true);
      connect(roomId, player.name, token);
    }, [connect, player, token]);

    useEffect(() => {
      if (ws == null) {
        return;
      }      
      ws?.addEventListener("open", onOpen);
      ws?.addEventListener("message", onMessage);
      ws?.addEventListener("error", onError);
      ws?.addEventListener("close", onClose);
  
      return () => {
        ws?.removeEventListener("open", onOpen);
        ws?.removeEventListener("message", onMessage);
        ws?.removeEventListener("error", onError);
        ws?.removeEventListener("close", onClose);
      }
    }, [ws, onMessage, onError, onClose]);
  
    return {
      connect: connectToRoom, 
      error, 
      isJoined,
      isConnecting} as JoinRoomAction;
  };
  