import { Flex, Heading, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import React from "react";
import { useRoomStore } from "../stores/RoomStore";
import PlayerName from "../PlayerName";
import { usePlayer } from "../contexts/PlayerContext";

const Header: React.FC = () => {
  const roomId = useRoomStore((state) => state.roomId);
  const player = usePlayer();
  return (
    <Heading size="xl" pt="10px" background="#ac4fc2" px="0.5em" py="0.25em">
      <Flex
        flexDirection="row"
        alignItems="start"
        justifyItems="center"
        justifyContent="space-between"
      >
        <Link as={RouterLink} to="/" color="#F2F3ED" mt="2">
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
