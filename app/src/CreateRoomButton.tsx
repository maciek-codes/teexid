import { Alert, AlertIcon, AlertTitle, Button, Input, Stack, Text } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useSocket } from "./contexts/WebsocketContext";
import { usePlayer } from "./contexts/PlayerContext";
import { ErrorPayload, ResponseMsg } from "./types";

interface CreateRoomButtonProps {}

type OnRoomCreatedPayload = {
  roomId: string
};

const CreateRoomButton: React.FC<CreateRoomButtonProps> = () => {
  const [roomIdText, setRoomIdText] = useState("");
  let navigate = useNavigate();

  const auth = useAuth();
  const player = usePlayer();
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const {ws, sendCommand} = useSocket();

  const createRoomClick = useCallback(() => {
    // Create room
    if (player?.name === null || player.name.trim() === '') {
      return;
    }
    sendCommand("create_room", {
        playerName: player.name
    });
    setIsJoining(true);
  }, [sendCommand, player]);

  const joinRoomClick = () => {
    navigate("room/" + roomIdText);
  };


  const onMessage = (evt: MessageEvent<any>) => {
    const msg = JSON.parse(evt.data) as ResponseMsg<unknown>;
    if (msg.type === "on_room_created") {
      const payload = msg.payload as OnRoomCreatedPayload;
      navigate("room/" + payload.roomId);
    }
    if (msg.type === "error") {
      const payload = msg.payload as ErrorPayload;
      if (payload.type === "room_not_found") {
        setJoinError(payload.message);
      }
    }
  }

  useEffect(() => {
    ws.addEventListener("message", onMessage);
    return () => {
      ws.removeEventListener("message", onMessage);
    }
  });

  return (
    <Stack>
      <Button isDisabled={auth.isLoading || isJoining || player?.name === null || player.name.trim() === ''} onClick={createRoomClick} my={5}>
        Start a new room
      </Button>

      <Text fontSize="sm">- or -</Text>
        <Input type="text" 
            placeholder="Room name" 
            onChange={(e) => setRoomIdText(e.target.value)} />
        <Button
          isLoading={isJoining}
          className="rounded-full bg-purple-700 text-white"
          isDisabled={roomIdText.trim() === "" || auth.isLoading || isJoining}
          onClick={joinRoomClick}
        >
          Join
        </Button>
        {isJoining ? <Text>Connecting...</Text> : null}
        {joinError !== null ? (
          <Alert status='error'>
            <AlertIcon />
            <AlertTitle>{joinError}</AlertTitle>
          </Alert>
        ) : null}
    </Stack>
  );
};

export default CreateRoomButton;
