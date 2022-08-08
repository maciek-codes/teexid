
import React, { useEffect } from "react";
import { Heading, Stack } from "@chakra-ui/react";

import { Game } from "./Game";

const GameRoom: React.FC = () => {

  useEffect(() => {
    console.log("Creating room");
    return () => {
      console.log("Tearing down room");
    }
  });

  return (
    <Stack px={20}>
      <Heading size="xl">Teexid</Heading>
      <Game />
    </Stack>
  );
};

export default GameRoom;