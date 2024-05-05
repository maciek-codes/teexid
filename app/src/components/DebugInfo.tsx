import { Stack, Text } from "@chakra-ui/react";
import React from "react";
import { shallow } from "zustand/shallow";

import { useGameStore } from "../stores/GameStore";

export const DebugInfo = (): JSX.Element => {
  const [playerId, isConnected] = useGameStore(
    (state) => [state.playerId, state.isConnected],
    shallow
  );
  return (
    <Stack
      fontSize="xs"
      backgroundColor="#f5f5f5"
      px={5}
      py={2}
      rounded="lg"
      opacity={0.4}
    >
      <Text>Connection Status:</Text>
      <Text as="b">{isConnected ? "Connected" : "Not Connected"}</Text>
      <Text>{"Client ID: " + playerId}</Text>
    </Stack>
  );
};
