import React from "react";

import { Stack, Text } from "@chakra-ui/react";

import { useSocket } from "../contexts/WebsocketContext";

const DebugInfo: React.FC = () => {
  const { connecting, connected } = useSocket();
  return (
    <Stack
      fontSize="3xs"
      backgroundColor="#f5f5f5"
      px={5}
      py={2}
      borderRadius={2}
      opacity={0.4}
    >
      <Text>
        Connection Status:
        <Text as="b">
          {connecting ? <> Re-connecting</> : null}
          {connected ? <> Connected</> : null}
        </Text>
      </Text>
    </Stack>
  );
};

export default DebugInfo;
