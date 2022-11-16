
import React, { useEffect } from "react";
import { Heading, Stack, Text, Alert, AlertIcon, AlertTitle, Link } from "@chakra-ui/react";

import { GameFeed } from "./GameFeed";
import { useSocket } from "./contexts/WebsocketContext";
import { useAuth } from "./hooks/useAuth";
import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import { Link as RouterLink } from "react-router-dom";

const GameRoom: React.FC = () => {
  const {sendCommand} = useSocket();
  
  const authQuery = useAuth();
  const token = authQuery.data?.token;
  const player = usePlayer();
  const {roomId, joinedState} = useRoom();
  const {connecting, connected} = useSocket();

  useEffect(() => {
    if (joinedState !== 'joined' && (player?.name ?? '') !== '') {
      sendCommand({type: "join_room", data: {
        roomId: roomId,
        playerName: player.name!,
      }});
    }
  }, [roomId, player, token, joinedState, sendCommand]);

  return (
    <Stack px={20}>
      {connecting ? <Alert>Re-connecting</Alert> : null}
      {connected ? <Alert>Connected</Alert>: null}
      <Heading size="xl">
        <Link as={RouterLink} to="/">Teexid</Link>
      </Heading>
      {/*hasError ? (
        <Alert status="error">
          <AlertIcon  />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      ) : null*/}
      {joinedState === 'joining' ? (
        <Text>Joining the room {roomId}</Text>
      ) : 
      <GameFeed />
      }
    </Stack>
  );
};

export default GameRoom;