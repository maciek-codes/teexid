import { useCallback, useEffect, useRef, useState } from "react";

import {useRoom} from '../contexts/RoomContext';
import {usePlayer} from '../contexts/PlayerContext';
import { ServerAction } from "../GameInit";
import { isJoinResponse, isPlayerUpatedResponse, SocketResponse } from "../models/SocketResponse";
import { useAuth } from "./useAuth";

export const useJoinRoom = () => {
    const room = useRoom();
    const player = usePlayer();
    const auth = useAuth();
    const token = auth.data?.token;
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const wsRef = useRef<WebSocket | null>(null);
    const sendAction = useCallback((data: ServerAction) => {
      if (!wsRef || !wsRef.current) {
        return;
      }
      wsRef.current.send(JSON.stringify(data));
    }, [wsRef]);
    
    useEffect(() => {
      if (!room || room.roomId === "" || !token || !player.name || wsRef.current !== null) {
        return;
      }
      setIsLoading(true);
      wsRef.current = new WebSocket(
        "ws://localhost:8080/rooms/" + room.roomId + "?token=" + token + "&playerName=" + player.name);
      wsRef.current.onopen = () => {
        console.log("On open");
        setIsLoading(false);
      }
      wsRef.current.onmessage = (event: MessageEvent<string>) => {
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
      }
      wsRef.current.onerror = (ev: Event) => {
        if (ev instanceof ErrorEvent) {
          const errorEv = ev as ErrorEvent;
          setError(new Error(errorEv.message));
        } else {
          setError(new Error("Unknown error: " + ev.currentTarget));
        }
      }
  
      const ws = wsRef.current;
      return () => {
        ws.close();
      }
    }, [room, player]);
  
    return {roomId: room.roomId, error, isLoading, sendAction};
  };
  