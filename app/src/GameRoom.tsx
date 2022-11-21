import React, { useEffect } from "react";
import { Heading, Stack, Text, Link, Box } from "@chakra-ui/react";

import { GameFeed } from "./GameFeed";
import { useSocket } from "./contexts/WebsocketContext";
import { useAuth } from "./hooks/useAuth";
import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import { Link as RouterLink } from "react-router-dom";

const GameRoom: React.FC = () => {
  const { sendCommand } = useSocket();

  const authQuery = useAuth();
  const token = authQuery.data?.token;
  const player = usePlayer();
  const { roomId, joinedState } = useRoom();
  const { connecting, connected } = useSocket();

  useEffect(() => {
    if (joinedState !== "joined" && (player?.name ?? "") !== "") {
      sendCommand({
        type: "join_room",
        data: {
          roomId: roomId,
          playerName: player.name!,
        },
      });
    }
  }, [roomId, player, token, joinedState, sendCommand]);

  /*
  Brandy Punch
#DC8B32

Ship Gray
#433D4B

Tana
#D9D3B6

Burnt Umber
#843225
*/
  return (
    <Box>
      <Heading size="xl" pt="10px" background="#48323A" px="0.5em" py="0.25em">
        <Link as={RouterLink} to="/" color="#E7E2C1" mt="10">
          TeeXid
        </Link>
      </Heading>
      {joinedState === "joining" ? (
        <Text>Joining the room {roomId}...</Text>
      ) : (
        <GameFeed />
      )}

      <Stack fontSize="3xs" backgroundColor="#f5f5f5">
        <Text>Debug info</Text>
        <Text>
          Connection Status:
          {connecting ? <> Re-connecting</> : null}
          {connected ? <> Connected</> : null}
        </Text>
        <Text>Room id: {roomId}</Text>
        <Text>Player id: {player.id}</Text>
        <Text>Room owner?: {player.isOwner ? "true" : "false"}</Text>
      </Stack>
    </Box>
  );
};

export default GameRoom;
