import React, { useEffect } from "react";
import { Stack, Text, Link, Box, Flex } from "@chakra-ui/react";

import { GameFeed } from "./GameFeed";
import { useSocket } from "./contexts/WebsocketContext";
import { useAuth } from "./hooks/useAuth";
import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";

const GameRoom: React.FC = () => {
  const { sendCommand } = useSocket();

  const authQuery = useAuth();
  const token = authQuery.data?.token;
  const player = usePlayer();
  const { roomId, joinedState } = useRoom();

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
      {joinedState === "joining" ? (
        <Text>Joining the room {roomId}...</Text>
      ) : (
        <GameFeed />
      )}
    </Box>
  );
};

export default GameRoom;
