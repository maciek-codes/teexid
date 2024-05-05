import React, { useState } from "react";
import { shallow } from "zustand/shallow";
import {
  Box,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";

import { useGameStore } from "./stores/GameStore";

interface PlayerEditProps {
  onClose?: () => void;
}

export const PlayerEdit = ({ onClose }: PlayerEditProps): JSX.Element => {
  const [name, setName] = useGameStore(
    (state) => [state.playerName, state.setPlayerName],
    shallow
  );
  const send = useGameStore((s) => s.send);
  const [value, setValue] = useState<string>(name ?? "");

  const updateName = () => {
    if (value?.trim() !== "") {
      setName(value);
      send({ type: "update_name", payload: { newName: value } });
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Stack backgroundColor="#537CB9" color="white" py={7} px={8} rounded="lg">
      <Text>Choose your nickname:</Text>
      <Input
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder="Enter your name"
        color="black"
        background="white"
      />
      <Button
        onClick={updateName}
        backgroundColor="#ac4fc2"
        _hover={{ bg: "#B47FC1" }}
      >
        Done
      </Button>
    </Stack>
  );
};

export const PlayerName: React.FC = () => {
  const { playerName } = useGameStore();
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (isEditingName) {
    return <PlayerEdit onClose={() => setIsEditingName(false)} />;
  }

  return (
    <Box>
      <Button onClick={() => onOpen()}>
        {playerName} <Box ml={2}>&#128100;</Box>
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent backgroundColor="#537CB9" color="#FFF">
          <ModalHeader>Update name</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <PlayerEdit onClose={() => onClose()} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PlayerName;
