import React, { useEffect } from "react";
import { shallow } from "zustand/shallow";

import { Box, CircularProgress, Stack, Text } from "@chakra-ui/react";

import { GameFeed } from "./GameFeed";
import { DebugInfo } from "./components/DebugInfo";
import { useGameStore } from "./stores/GameStore";
import { useNavigate } from "react-router-dom";

const GameRoom: React.FC = () => {
  const [connectionState, roomState, joinRoom, roomName] = useGameStore(
    (s) => [s.connectionState, s.roomState, s.joinRoom, s.roomName],
    shallow
  );
  const navigate = useNavigate();
  const isConnected = connectionState === "connected";

  useEffect(() => {
    const roomNameFromPath = location.pathname.split("/").pop();
    if (
      isConnected &&
      (roomState === "not_joined" || roomName !== roomNameFromPath)
    ) {
      if (roomNameFromPath) {
        joinRoom(roomNameFromPath);
      } else {
        navigate("/");
      }
    } else if (isConnected && roomState === "failed_to_join") {
      navigate("/");
    }
  }, [isConnected, roomState]);

  if (!isConnected) {
    return (
      <Box backgroundColor="#ac4fc2" color="#F2F3ED">
        <CircularProgress isIndeterminate={true} />
        <Text>Connecting...</Text>
      </Box>
    );
  }

  if (roomState === "joining") {
    return (
      <Box backgroundColor="#ac4fc2" color="#F2F3ED">
        <CircularProgress isIndeterminate={true} />
        <Text>Joining the room {roomName}</Text>
      </Box>
    );
  }

  // TODO: ALLOW TO JOIN AS SPECTATOR
  if (roomState === "failed_to_join") {
    return (
      <>
        <Text>Failed to join - game in progress</Text>
      </>
    );
  }

  return (
    <Stack>
      <GameFeed />
      <DebugInfo />
    </Stack>
  );
};

export default GameRoom;
