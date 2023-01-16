import React, { useEffect } from "react";
import { Text, Progress } from "@chakra-ui/react";

import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import { useJoinRoom } from "./queries/useJoinRoom";
import PlayerName from "./PlayerName";
import { QueryClient } from "@tanstack/react-query";
import { GameFeed } from "./GameFeed";

const queryClient = new QueryClient();

const GameRoom: React.FC = () => {
  const player = usePlayer();
  const { roomId, joinedState } = useRoom();
  const joinRoomMutation = useJoinRoom(roomId);

  useEffect(() => {
    if (joinRoomMutation.isIdle) {
      // Create room
      if (player?.name === null || player.name.trim() === "" || roomId === "") {
        return;
      }
      joinRoomMutation.mutate({
        playerName: player.name,
        roomName: roomId,
      });
    }
  }, [player, roomId]);

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
  if (joinRoomMutation.isError) {
    return <Text>{"Error connecting:" + joinRoomMutation.error}</Text>;
  }

  if (joinRoomMutation.isLoading) {
    return (
      <>
        <Text>Loading ...</Text>
        <Progress size="xs" isIndeterminate />
      </>
    );
  }

  if (player?.name === null || player.name === "") {
    return <PlayerName />;
  }

  return <GameFeed />;
};

export default GameRoom;
