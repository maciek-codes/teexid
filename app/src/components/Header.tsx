import { Flex, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import React from "react";
import { useGameStore } from "../stores/GameStore";
import PlayerName from "../PlayerName";

const Header: React.FC = () => {
  const [playerName, roomName] = useGameStore((s) => [
    s.playerName,
    s.roomName,
  ]);
  return (
    <Heading size="xl" pt="10px" background="#ac4fc2" px="0.5em" py="0.25em">
      <Flex
        flexDirection="row"
        alignItems="start"
        justifyItems="center"
        justifyContent="space-between"
      >
        <Stack direction="row" alignContent="center" justifyContent="center">
          <Link as={RouterLink} to="/" color="#F2F3ED" mt="2">
            TeeXid
          </Link>

          <Link as={RouterLink} to="/about" color="#F2F3ED" fontSize="sm">
            About
          </Link>
        </Stack>

        <Flex
          alignSelf="flex-end"
          alignContent="end"
          alignItems="center"
          justifyContent="space-evenly"
          justifyItems="center"
          flexDirection="row"
        >
          {playerName !== "" && <PlayerName />}
          {roomName !== "" && (
            <Text fontSize="md" color="white" ml="20px">
              Room: {roomName}
            </Text>
          )}
        </Flex>
      </Flex>
    </Heading>
  );
};

export default Header;
