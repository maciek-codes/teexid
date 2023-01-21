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

import { usePlayer } from "./contexts/PlayerContext";

interface PlayerEditProps {
  onClose?: () => void;
}

export const PlayerEdit: React.FC<PlayerEditProps> = ({ onClose }) => {
  const { name, setName } = usePlayer();
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
    <Stack>
      <Text>What is your player's name?</Text>
      <Input
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder="Enter your name"
        background="white"
      />
      <Button onClick={updateName}>Done</Button>
    </Stack>
  );
};

export const PlayerName: React.FC = () => {
  const { name } = usePlayer();
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
