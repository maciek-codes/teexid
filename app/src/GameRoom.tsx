import React, { useEffect } from "react";

import { AxiosError } from "axios";
import { Text, Progress, Stack } from "@chakra-ui/react";

import { PlayerEdit } from "./PlayerName";
import { usePlayer } from "./contexts/PlayerContext";
import { useRoomStore } from "./stores/RoomStore";
import { useJoinRoom } from "./queries/useJoinRoom";
import { GameFeed } from "./GameFeed";
import { WebSocketContextProvider } from "./contexts/WebsocketContext";
import { useGameCommand } from "./queries/useGameCommand";
import { useParams } from "react-router-dom";

const GameRoom: React.FC = () => {
  const player = usePlayer();

  const roomId = useRoomStore((state) => state.roomId);
  const params = useParams();
  const joinedState = useRoomStore((state) => state.joinedState);

  const joinRoomQuery = useJoinRoom();
  const fetchHistoryQuery = useGameCommand("fetch_history");
  const hasPlayerName = player.name !== "";

  useEffect(() => {
    // Join the room
    if (player.name !== null && player.name !== "") {
      if (joinRoomQuery.isIdle && !joinRoomQuery.isSuccess) {
        joinRoomQuery.mutate({
          playerName: player.name,
          playerId: player.id,
          roomName: params.roomId?.toLowerCase().trim() ?? "",
        });
      }
    }
  }, [player, roomId, joinRoomQuery]);

  if (joinRoomQuery.isSuccess && fetchHistoryQuery.isIdle) {
    fetchHistoryQuery.mutate({});
  }

  if (fetchHistoryQuery.isSuccess) {
    console.log("History", fetchHistoryQuery.data);
  }

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
    return <PlayerEdit />;
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
