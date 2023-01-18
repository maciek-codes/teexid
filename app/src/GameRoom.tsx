import React, { useEffect } from "react";
import { Text, Progress } from "@chakra-ui/react";

import PlayerName from "./PlayerName";
import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import { useJoinRoom } from "./queries/useJoinRoom";
import { GameFeed } from "./GameFeed";
import { WebSocketContextProvider } from "./contexts/WebsocketContext";

const GameRoom: React.FC = () => {
  const player = usePlayer();
  const { roomId, joinedState } = useRoom();
  const {
    mutate: joinRoom,
    isSuccess,
    isLoading,
    isIdle,
    isError,
    error,
  } = useJoinRoom();
  const hasPlayerName = (player.name ?? "") !== "";

  useEffect(() => {
    // Join the room
    if (player.name !== null && player.name !== "") {
      if (isIdle && !isSuccess) {
        joinRoom({
          playerName: player.name,
          playerId: player.id,
          roomName: roomId,
        });
      }
    }
  }, [player, roomId, joinRoom]);

  if (isError) {
    return <Text>{"Error connecting:" + error}</Text>;
  }

  if (isLoading) {
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
