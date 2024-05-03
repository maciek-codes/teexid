import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Flex, Input, Stack, Text } from "@chakra-ui/react";

import { useWebsocketContext } from "./context/WebsocketContextProvider";
import { DebugInfo } from "./components/DebugInfo";
import { useGameStore } from "./stores/GameStore";

export const Lobby = (): JSX.Element => {
  const { send } = useWebsocketContext();
  const [roomName, setRoomName, playerName, setPlayerName] = useGameStore(
    (state) => [
      state.roomName,
      state.setRoomName,
      state.playerName,
      state.setPlayerName,
    ]
  );

  const [roomNameLocal, setRoomNameLocal] = useState(roomName);
  const [playerNameLocal, setPlayerNameLocal] = useState(playerName);
  const navigate = useNavigate();

  const joinRoomClick = () => {
    setRoomName(roomNameLocal);
    setPlayerName(playerNameLocal);
    send({
      type: "join_room",
      payload: {
        roomName: roomNameLocal,
        playerName: playerNameLocal,
      },
    });
    navigate(`/rooms/${roomNameLocal}`);
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
            value={roomNameLocal}
            onChange={(e) => setRoomNameLocal(e.target.value.trim())}
          />

          <Input
            type="text"
            placeholder="Player name"
            background="white"
            color="black"
            value={playerNameLocal}
            onChange={(e) => setPlayerNameLocal(e.target.value.trim())}
          />

          <Button
            className="rounded-full bg-purple-700 text-white"
            isDisabled={roomNameLocal === "" || playerNameLocal === ""}
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
