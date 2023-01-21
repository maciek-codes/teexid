import React, { useState } from "react";

import { Button, Flex, Input, Stack, Text } from "@chakra-ui/react";

import { usePlayer } from "./contexts/PlayerContext";
import { PlayerEdit } from "./PlayerName";
import { useLocation, useNavigate } from "react-router-dom";

interface LobbyProps {}

export const Lobby: React.FC<LobbyProps> = () => {
  const location = useLocation();
  const [roomIdText, setRoomIdText] = useState("");

  const player = usePlayer();
  const navigate = useNavigate();

  const joinRoomClick = () => {
    navigate("/rooms/" + roomIdText.toLowerCase());
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
      <Stack flexDir="column">
        {player.name === "" && <PlayerEdit />}
        {player.name !== "" && (
          <Stack pt="5px">
            <Text fontSize="smaller">
              Enter the room name to start a new room or type in the room name
              that someone shared with you
            </Text>
            <Input
              type="text"
              placeholder="Room name"
              background="white"
              onChange={(e) => setRoomIdText(e.target.value)}
            />

            <Button
              className="rounded-full bg-purple-700 text-white"
              isDisabled={roomIdText.trim() === ""}
              onClick={joinRoomClick}
            >
              Join or start a room
            </Button>
          </Stack>
        )}
      </Stack>
    </Flex>
  );
};
