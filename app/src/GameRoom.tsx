import React, { useEffect } from "react";

import { Text, Progress, Stack } from "@chakra-ui/react";

import { useJoinRoom } from "./queries/useJoinRoom";
import { GameFeed } from "./GameFeed";
import { DebugInfo } from "./components/DebugInfo";
import { useGameStore } from "./stores/GameStore";
import { useNavigate } from "react-router-dom";

const GameRoom: React.FC = () => {
  useJoinRoom();
  const [isConnected, roomState] = useGameStore((state) => [
    state.isConnected,
    state.roomState,
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) {
      navigate("/");
    }
  }, [isConnected]);

  if (roomState === "joining") {
    return (
      <>
        <Text>Loading ...</Text>
        <Progress isIndeterminate={true} isAnimated={true}>
          Joining the room
        </Progress>
      </>
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
