import { Alert, AlertIcon, AlertTitle, Button, Input, Stack, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Player from "./models/Player";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useJoinRoom } from "./hooks/useJoinRoom";

interface CreateRoomButtonProps {}

type JoinData = {id: string, players: Player[]};

const createRoom = async (token: string): Promise<JoinData> => {
  return await (
    await fetch("http://localhost:8080/rooms?token=" + token, {
      method: "POST",
    })
  ).json();
};

const CreateRoomButton: React.FC<CreateRoomButtonProps> = () => {
  const [roomIdText, setRoomIdText] = useState("");
  let navigate = useNavigate();


  const auth = useAuth();
  const token = auth.data?.token;
  const createRoomMutation = useMutation(() => createRoom(token ?? ''), {
    onSuccess: (data) => {
      navigate("room/" + data.id);
    }
  });

  const {connect, isConnecting, isJoined, error} = useJoinRoom();

  const createRoomClick = () => {
    createRoomMutation.mutate();
  };

  const joinRoomClick = () => {
    connect(roomIdText);
  };

  if (isJoined) {
    navigate("/room/" + roomIdText);
    return (
    );
  }

  return (
    <Stack>
      <Button isDisabled={auth.isLoading || isConnecting} onClick={createRoomClick} my={5}>
        Start a new room
      </Button>

      <Text fontSize="sm">- or -</Text>      <>
        <Input type="text" 
            placeholder="Room name" 
            onChange={(e) => setRoomIdText(e.target.value)} />
        <Button
          isLoading={isConnecting}
          className="rounded-full bg-purple-700 text-white"
          isDisabled={roomIdText.trim() === "" || auth.isLoading || isConnecting}
          onClick={joinRoomClick}
        >
          Join
        </Button>
        {isConnecting ? <Text>Connecting...</Text> : null}
        {error ? (
          <Alert status='error'>
            <AlertIcon />
            <AlertTitle>{error.message}</AlertTitle>
          </Alert>
        ) : null}
      </>
    </Stack>
  );
};

export default CreateRoomButton;
