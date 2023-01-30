import React, { useState } from "react";

import { Button, Flex, Input, Stack, Text } from "@chakra-ui/react";

import { usePlayerStore } from "./stores/PlayerStore";
import { PlayerEdit } from "./PlayerName";
import { useLocation, useNavigate } from "react-router-dom";
import { useJoinRoom } from "./queries/useJoinRoom";

interface LobbyProps {}

export const Lobby: React.FC<LobbyProps> = () => {
  const location = useLocation();
  const [roomIdText, setRoomIdText] = useState("");

  const player = usePlayerStore();
  const navigate = useNavigate();
  const { mutate: joinRoom, isIdle: joinRoomIdle, isLoading } = useJoinRoom();

  const joinRoomClick = () => {
    if (joinRoomIdle) {
      joinRoom(
        {
          playerName: player.name,
          playerId: player.id,
          roomName: roomIdText.toLowerCase(),
        },
        {
          onSuccess: () => navigate("/rooms/" + roomIdText.toLowerCase()),
        }
      );
    }
  };

  if (location.pathname.indexOf("/rooms/") === 0) {
    return null;
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
        borderRadius={10}
      >
        {player.name === "" && <PlayerEdit />}
        {player.name !== "" && (
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
              onChange={(e) => setRoomIdText(e.target.value)}
            />

            <Button
              className="rounded-full bg-purple-700 text-white"
              isDisabled={roomIdText.trim() === ""}
              onClick={joinRoomClick}
              isLoading={isLoading}
              backgroundColor="#B0CC69"
            >
              Join or start a room
            </Button>
          </Stack>
        )}
      </Stack>
    </Flex>
  );
};
