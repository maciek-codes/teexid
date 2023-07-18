import React from "react";

import { Stack, Text } from "@chakra-ui/react";

interface DebugInfoProps {
  connecting: boolean;
  connected: boolean;
}

export const DebugInfo: React.FC<DebugInfoProps> = (props) => {
  const { connecting, connected } = props;
  return (
    <Stack
      fontSize="xs"
      backgroundColor="#f5f5f5"
      px={5}
      py={2}
      rounded="lg"
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
