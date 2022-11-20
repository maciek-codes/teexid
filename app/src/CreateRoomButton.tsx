import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  Input,
  Text,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useSocket } from "./contexts/WebsocketContext";
import { usePlayer } from "./contexts/PlayerContext";
import { ResponseMsg } from "./types";
import PlayerName from "./PlayerName";

interface CreateRoomButtonProps {}

const CreateRoomButton: React.FC<CreateRoomButtonProps> = () => {
  const [roomIdText, setRoomIdText] = useState("");
  const navigate = useNavigate();

  const auth = useAuth();
  const player = usePlayer();
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const { addMsgListener, removeMsgListener, sendCommand } = useSocket();

  const createRoomClick = useCallback(() => {
    // Create room
    if (player?.name === null || player.name.trim() === "") {
      return;
    }
    sendCommand({
      type: "create_room",
      data: {
        playerName: player.name,
      },
    });
    setIsJoining(true);
  }, [sendCommand, player]);

  const joinRoomClick = () => {
    navigate("room/" + roomIdText);
  };

  const onMessage = ({ type, payload }: ResponseMsg) => {
    if (type === "on_room_created") {
      navigate("room/" + payload.roomId);
    }
    if (type === "error") {
      if (payload.type === "room_not_found") {
        setJoinError(payload.message);
      }
    }
  };

  useEffect(() => {
    addMsgListener(onMessage);
    return () => {
      removeMsgListener(onMessage);
    };
  });

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center">
      <Box>
        <PlayerName />
      </Box>
      <Box alignItems="center">
        <Button
          isDisabled={
            auth.isLoading ||
            isJoining ||
            player?.name === null ||
            player.name.trim() === ""
          }
          onClick={createRoomClick}
          my={5}
        >
          Start a new room
        </Button>

        <Box verticalAlign="center">
          <Text fontSize="sm">- or -</Text>
        </Box>
        <Input
          type="text"
          placeholder="Room name"
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
        {joinError !== null ? (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>{joinError}</AlertTitle>
          </Alert>
        ) : null}
      </Box>
    </Flex>
  );
};

export default CreateRoomButton;
