import { Button, Input, Stack, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { usePlayer } from "./contexts/PlayerContext";
import Player from "./models/Player";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

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
  const player = usePlayer();
  let navigate = useNavigate();

  const auth = useAuth();
  const token = auth.data?.token;
  const createRoomMutation = useMutation(() => createRoom(token ?? ''), {
    onSuccess: (data) => {
      navigate("room/" + data.id);
    }
  });

  const createRoomClick = () => {
    createRoomMutation.mutate();
  };

  const joinRoomClick = () => {
    console.log("join as " + player.name);
    navigate("room/" + roomIdText);
  };

  return (
    <Stack>
      <Button isDisabled={auth.isLoading} onClick={createRoomClick} my={5}>
        Start a new room
      </Button>

      <Text fontSize="sm">- or -</Text>      <>
        <Input type="text" 
            placeholder="Room name" 
            onChange={(e) => setRoomIdText(e.target.value)} />
        <Button
          className="rounded-full bg-purple-700 text-white"
          isDisabled={auth.isLoading}
          onClick={joinRoomClick}
        >
          Join
        </Button>
      </>
    </Stack>
  );
};

export default CreateRoomButton;
