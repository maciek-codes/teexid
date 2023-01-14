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
      margin="auto"
    >
      <Stack flexDir="column">
        <PlayerName />
        {(player?.name ?? "") !== "" && (
          <Stack px={5}>
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
              isLoading={isJoining}
              className="rounded-full bg-purple-700 text-white"
              isDisabled={
                roomIdText.trim() === "" || auth.isLoading || isJoining
              }
              onClick={joinRoomClick}
            >
              Join or start a room
            </Button>
          </Stack>
        )}
        {isJoining ? <Text>Connecting...</Text> : null}
      </Stack>
    </Flex>
  );
};

export default CreateRoomButton;
