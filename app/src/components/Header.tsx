import { Flex, Heading, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import React from "react";
import { useRoom } from "../contexts/RoomContext";
import PlayerName from "../PlayerName";
import { usePlayer } from "../contexts/PlayerContext";

const Header: React.FC = () => {
  const { roomId } = useRoom();
  const player = usePlayer();
  return (
    <Heading size="xl" pt="10px" background="#EAE0CC" px="0.5em" py="0.25em">
      <Flex
        flexDirection="row"
        alignItems="start"
        justifyItems="center"
        justifyContent="space-between"
      >
        <Link as={RouterLink} to="/" color="#0E0E0E" mt="2">
          TeeXid
        </Link>

        <Flex
          alignSelf="flex-end"
          alignContent="end"
          alignItems="center"
          justifyContent="space-evenly"
          justifyItems="center"
          flexDirection="row"
        >
          {player?.name !== "" && <PlayerName />}

          {roomId !== "" && (
            <Text fontSize="md" color="white" ml="20px">
              Room: {roomId}
            </Text>
          )}
        </Flex>
      </Flex>
    </Heading>
  );
};

export default Header;
