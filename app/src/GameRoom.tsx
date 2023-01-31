import React, { useEffect } from "react";

import { AxiosError } from "axios";
import { Text, Progress, Stack } from "@chakra-ui/react";

import { PlayerEdit } from "./PlayerName";
import { usePlayerStore } from "./stores/PlayerStore";
import { useRoomStore } from "./stores/RoomStore";
import { useJoinRoom } from "./queries/useJoinRoom";
import { GameFeed } from "./GameFeed";
import { useWebsocket } from "./hooks/useWebsocket";
import { useGameCommand } from "./queries/useGameCommand";
import { useParams } from "react-router-dom";
import { DebugInfo } from "./components/DebugInfo";

const GameRoom: React.FC = () => {
  const { name: playerName, id: playerId } = usePlayerStore();

  const params = useParams();
  const joinedState = useRoomStore((state) => state.joinedState);

  const joinRoomQuery = useJoinRoom();
  const fetchHistoryQuery = useGameCommand("fetch_history");
  const hasPlayerName = playerName !== "";
  const { connState } = useWebsocket();

  useEffect(() => {
    // Join the room
    if (playerName !== null && playerName !== "") {
      if (joinRoomQuery.isIdle && !joinRoomQuery.isSuccess) {
        joinRoomQuery.mutate({
          playerName,
          playerId,
          roomName: params.roomId?.toLowerCase().trim() ?? "",
        });
      }
    }
  }, [playerName, playerId, params.roomId, joinRoomQuery]);

  if (
    joinRoomQuery.isSuccess &&
    !fetchHistoryQuery.isSuccess &&
    !fetchHistoryQuery.isLoading
  ) {
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
    <Stack>
      <GameFeed />
      <DebugInfo
        connecting={connState === "connecting"}
        connected={connState === "connected"}
      />
    </Stack>
  );
};

export default GameRoom;
