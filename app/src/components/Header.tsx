import { Flex, Heading, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import React from "react";
import { CopyButton } from "./CopyButton";
import { useRoom } from "../contexts/RoomContext";

const Header: React.FC = () => {
  const { roomId } = useRoom();
  return (
    <Heading size="xl" pt="10px" background="#48323A" px="0.5em" py="0.25em">
      <Flex
        flexDirection="row"
        alignItems="start"
        justifyItems="center"
        justifyContent="space-between"
      >
        <Link as={RouterLink} to="/" color="#E7E2C1" mt="2">
          TeeXid
        </Link>

        {roomId !== "" && (
          <Text fontSize="md" alignSelf="flex-end" color="white">
            Room: {roomId} <CopyButton copyText={roomId} />
          </Text>
        )}
      </Flex>
    </Heading>
  );
};

export default Header;
