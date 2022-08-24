
import React, { useCallback, useEffect, useState } from "react";
import { Heading, Stack, Text, Alert, AlertIcon, AlertTitle } from "@chakra-ui/react";

import { GameFeed } from "./GameFeed";
import { useSocket } from "./contexts/WebsocketContext";
import { useAuth } from "./hooks/useAuth";
import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import { ErrorPayload } from "./types";

type OnJoinedPayload = {
  roomId: string,
  ownerId: string,
  playerId: string,
};

const GameRoom: React.FC = () => {
  const {addMsgListener, removeMsgListener, sendCommand} = useSocket();
  
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const authQuery = useAuth();
  const token = authQuery.data?.token;
  const player = usePlayer();
  const roomId = useRoom();

  const onMessage = useCallback((type: string, data: unknown) => {
    if (type === "on_joined") {
      setIsJoined(true);
      const payload = data as OnJoinedPayload;
      if (payload.playerId !== authQuery.data?.playerId) {
        setErrorMsg("Wrong room?")
      } else {
        setErrorMsg(null);
        player.setIsOwner(payload.ownerId === payload.playerId);
      }
      setIsJoining(false);
    } else if (type === "error") {
      const payload = data as ErrorPayload;
      setIsJoining(false);
      setErrorMsg(payload.message);
    }
  }, [player, authQuery, setErrorMsg, setIsJoining]);

  useEffect(() => {
    addMsgListener(onMessage);
    if (!isJoined && !isJoining && player.name !== '') {
      setIsJoining(true);
      sendCommand("join_room", {
          roomId: roomId,
          playerName: player.name,
      });
    }
    return () => {
      removeMsgListener(onMessage);
    }
  }, [roomId, player, token, onMessage, isJoined, isJoining, sendCommand, addMsgListener, removeMsgListener]);

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
      <GameFeed />
      }
    </Stack>
  );
};

export default GameRoom;