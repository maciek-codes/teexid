import React, { useEffect } from "react";
import { Text, Progress, Stack } from "@chakra-ui/react";

import PlayerName from "./PlayerName";
import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import { useJoinRoom } from "./queries/useJoinRoom";
import { GameFeed } from "./GameFeed";
import { WebSocketContextProvider } from "./contexts/WebsocketContext";
import { AxiosError } from "axios";

const GameRoom: React.FC = () => {
  const player = usePlayer();
  const { roomId, joinedState } = useRoom();
  const joinRoomQuery = useJoinRoom();
  const hasPlayerName = (player.name ?? "") !== "";

  useEffect(() => {
    // Join the room
    if (player.name !== null && player.name !== "") {
      if (joinRoomQuery.isIdle && !joinRoomQuery.isSuccess) {
        joinRoomQuery.mutate({
          playerName: player.name,
          playerId: player.id,
          roomName: roomId.toLowerCase().trim(),
        });
      }
    }
  }, [
    player,
    roomId,
    joinRoomQuery.isIdle,
    joinRoomQuery.isSuccess,
    joinRoomQuery.mutate,
  ]);

  if (
    joinRoomQuery.isError &&
    (joinRoomQuery.error as AxiosError).code === AxiosError.ERR_NETWORK
  ) {
    return (
      <Stack>
        <Text size="lg">Ooops! The server seems to be down.</Text>
      </Stack>
    );
  }

  if (joinRoomQuery.isError) {
    return (
      <Stack>
        <Text size="lg">Error connecting!</Text>
        <Text>
          {((joinRoomQuery.error as AxiosError).code as string) ?? ""}
        </Text>
      </Stack>
    );
  }

  if (joinRoomQuery.isLoading) {
    return (
      <>
        <Text>Loading ...</Text>
        <Progress size="xs" isIndeterminate />
      </>
    );
  }

  if (!hasPlayerName) {
    return <PlayerName />;
  }

  if (joinedState !== "joined") {
    return (
      <>
        <Text>Loading ...</Text>
        <Progress isIndeterminate={true} isAnimated={true}>
          Joining the room
        </Progress>
      </>
    );
  }

  return (
    <WebSocketContextProvider>
      <GameFeed />
    </WebSocketContextProvider>
  );
};

export default GameRoom;
