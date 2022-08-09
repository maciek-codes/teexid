
import React, { useCallback, useEffect, useState } from "react";
import { Heading, Stack, Text, Alert, AlertIcon, AlertTitle } from "@chakra-ui/react";

import { Game } from "./Game";
import { useSocket } from "./contexts/WebsocketContext";
import { useAuth } from "./hooks/useAuth";
import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import { ErrorPayload, ResponseMsg } from "./types";

type OnJoinedPayload = {
  roomId: string,
  ownerId: string,
  playerId: string,
};


const GameRoom: React.FC = () => {
  const {ws, sendCommand} = useSocket();
  
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const authQuery = useAuth();
  const token = authQuery.data?.token;
  const player = usePlayer();
  const roomId = useRoom();

  const onMessage = useCallback((evt: MessageEvent<any>) => {
    const msg = JSON.parse(evt.data) as ResponseMsg<unknown>;
    if (msg.type === "on_joined") {
      setIsJoined(true);
      const payload = msg.payload as OnJoinedPayload;
      if (payload.playerId !== authQuery.data?.playerId) {
        setErrorMsg("Wrong room?")
      } else {
        setErrorMsg(null);
      }
      setIsJoining(false);
    } else if (msg.type === "error") {
      const payload = msg.payload as ErrorPayload;
      setIsJoining(false);
      setErrorMsg(payload.message);
    }
  }, [authQuery, setErrorMsg, setIsJoining]);

  useEffect(() => {
    ws.addEventListener("message", onMessage);
    if (!isJoined && !isJoining && player.name !== '' && ws.OPEN === ws.readyState) {
      setIsJoining(true);
      sendCommand("join_room", {
          roomId: roomId,
          playerName: player.name,
      });
    }
    return () => {
      ws.removeEventListener("message", onMessage);
    }
  }, [roomId, player, ws, token, onMessage, isJoined, isJoining, sendCommand]);

  return (
    <Stack px={20}>
      <Heading size="xl">Teexid</Heading>
      {errorMsg !== null ? (
        <Alert status="error">
          <AlertIcon  />
          <AlertTitle>{errorMsg}</AlertTitle>
        </Alert>
      ) : null}
      {isJoining ? (
        <Text>Joining the room {roomId}</Text>
      ) : 
      <Game />
      }
    </Stack>
  );
};

export default GameRoom;