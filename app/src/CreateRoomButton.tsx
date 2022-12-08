import React, { useEffect, useState } from "react";

import { Button, Flex, Input, Stack, Text } from "@chakra-ui/react";

import { useAuth } from "./hooks/useAuth";
import { useSocket } from "./contexts/WebsocketContext";
import { usePlayer } from "./contexts/PlayerContext";
import PlayerName from "./PlayerName";
import { useRoom } from "./contexts/RoomContext";
import { useNavigate } from "react-router-dom";

interface CreateRoomButtonProps {}

const CreateRoomButton: React.FC<CreateRoomButtonProps> = () => {
  const [roomIdText, setRoomIdText] = useState("");

  const auth = useAuth();
  const player = usePlayer();
  const { roomId } = useRoom();
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const navigate = useNavigate();
  const { sendCommand } = useSocket();

  const joinRoomClick = () => {
    // Create room
    if (player?.name === null || player.name.trim() === "") {
      return;
    }
    sendCommand({
      type: "create_room",
      data: {
        playerName: player.name,
        roomId: roomIdText,
      },
    });
    setIsJoining(true);
  };

  useEffect(() => {
    if (roomId !== "") {
      navigate(`/room/${roomId}`);
    }
  }, [roomId, navigate]);

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width="100vh"
      height="100vh"
      margin="auto"
    >
      <Stack flexDir="column">
        <PlayerName />
        <Input
          type="text"
          placeholder="Room name"
          background="white"
          onChange={(e) => setRoomIdText(e.target.value)}
        />
        <Button
          isLoading={isJoining}
          className="rounded-full bg-purple-700 text-white"
          isDisabled={roomIdText.trim() === "" || auth.isLoading || isJoining}
          onClick={joinRoomClick}
        >
          Join a room
        </Button>
        {isJoining ? <Text>Connecting...</Text> : null}
      </Stack>
    </Flex>
  );
};

export default CreateRoomButton;
