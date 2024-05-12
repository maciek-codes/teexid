import { Box, Flex, Heading, Link, Text } from "@chakra-ui/react";
import React from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { shallow } from "zustand/shallow";

import { useGameStore } from "../stores/GameStore";
import PlayerName from "../PlayerName";

const Header: React.FC = () => {
  const [playerName, roomName] = useGameStore(
    (s) => [s.playerName, s.roomName],
    shallow
  );
  const location = useLocation();
  const isRoomPath = location.pathname.indexOf("room/") !== -1;
  return (
    <Heading size="xl" pt="10px" background="#ac4fc2" px="0.5em" py="0.25em">
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyItems="center"
        justifyContent="space-between"
      >
        <Box gap="20px" display="flex">
          <Link as={RouterLink} to="/" color="#F2F3ED" fontSize="lg">
            TeeXid
          </Link>

          <Link as={RouterLink} to="/about" color="#F2F3ED" fontSize="lg">
            About
          </Link>
        </Box>
        <Flex
          alignSelf="flex-end"
          alignContent="end"
          alignItems="center"
          justifyContent="space-evenly"
          justifyItems="center"
          flexDirection="row"
        >
          {playerName !== "" && <PlayerName />}
          {isRoomPath && roomName !== "" && (
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
