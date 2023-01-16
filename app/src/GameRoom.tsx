import React, { useEffect } from "react";
import { Text, Progress } from "@chakra-ui/react";

import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import { useJoinRoom } from "./queries/useJoinRoom";
import PlayerName from "./PlayerName";
import { GameFeed } from "./GameFeed";
import { WebSocketContextProvider } from "./contexts/WebsocketContext";

const GameRoom: React.FC = () => {
  const player = usePlayer();
  const { roomId, joinedState, dispatch } = useRoom();
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

  useEffect(() => {
    if (joinRoomMutation.isSuccess && joinedState !== "joined") {
      dispatch({
        type: "on_joined",
        payload: {
          ...joinRoomMutation.data,
        },
      });
    }
  }, [joinRoomMutation.isSuccess]);

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

  return (
    <WebSocketContextProvider>
      <GameFeed />
    </WebSocketContextProvider>
  );
};

export default GameRoom;
