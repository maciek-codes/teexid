import { Stack, Text } from "@chakra-ui/react";
import React from "react";
import { usePlayer } from "../contexts/PlayerContext";
import { useRoom } from "../contexts/RoomContext";
import { useSocket } from "../contexts/WebsocketContext";

const DebugInfo: React.FC = () => {
  const { roomId } = useRoom();
  const player = usePlayer();
  const { connecting, connected } = useSocket();
  return (
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
  );
};

export default DebugInfo;
