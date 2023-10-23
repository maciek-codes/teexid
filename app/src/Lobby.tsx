import React from "react";
import { useNavigate } from "react-router-dom";

import { Button, Flex, Input, Stack, Text } from "@chakra-ui/react";

import { useJoinRoom } from "./queries/useJoinRoom";
import { DebugInfo } from "./components/DebugInfo";
import { useGameStore } from "./stores/GameStore";

export const Lobby = (): JSX.Element => {
  const joinRoom = useJoinRoom();
  const [roomName, setRoomName, playerName, setPlayerName] = useGameStore(
    (state) => [
      state.roomName,
      state.setRoomName,
      state.playerName,
      state.setPlayerName,
    ]
  );
  const navigate = useNavigate();

  const joinRoomClick = () => {
    joinRoom();
    navigate(`/rooms/${roomName}`);
  };

  if (location.pathname.indexOf("/rooms/") === 0) {
    return <></>;
  }

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      margin="auto"
    >
      <Stack
        flexDir="column"
        backgroundColor="#537CB9"
        color="#F2F3ED"
        padding={2}
        paddingTop={1}
        rounded="lg"
      >
        <Stack pt="5px">
          <Text fontSize="md">
            Enter the room name to start a new room or type in the room name
            that someone shared with you
          </Text>
          <Input
            type="text"
            placeholder="Room name"
            background="white"
            color="black"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value.trim())}
          />

          <Input
            type="text"
            placeholder="Player name"
            background="white"
            color="black"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.trim())}
          />

          <Button
            className="rounded-full bg-purple-700 text-white"
            isDisabled={roomName === "" || playerName === ""}
            onClick={joinRoomClick}
            backgroundColor="#B0CC69"
          >
            Join or start a room
          </Button>
        </Stack>
      </Stack>
      <DebugInfo />
    </Flex>
  );
};
