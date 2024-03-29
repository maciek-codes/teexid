import React, { useState } from "react";
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

import { usePlayerStore } from "./stores/PlayerStore";

interface PlayerEditProps {
  onClose?: () => void;
}

export const PlayerEdit: React.FC<PlayerEditProps> = ({ onClose }) => {
  const { name, setName } = usePlayerStore();
  const [value, setValue] = useState<string>(name ?? "");

  const updateName = () => {
    if (value?.trim() !== "") {
      setName(value);
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
  const { name } = usePlayerStore();
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (isEditingName) {
    return <PlayerEdit onClose={() => setIsEditingName(false)} />;
  }

  return (
    <Box>
      <Button onClick={() => onOpen()}>
        {name} <Box ml={2}>&#128100;</Box>
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
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
