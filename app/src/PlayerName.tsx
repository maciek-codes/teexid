import React, { useState } from "react";
import { Box, Button, Input, Stack, Text } from "@chakra-ui/react"

import { usePlayer } from "./contexts/PlayerContext";

const PlayerName: React.FC = () => {

  const { name, setName } = usePlayer();

  const [value, setValue] = useState<string>(name ?? '');

  const [isEditingName, setIsEditingName] = useState(name === '' || name === null);

  const updateName = () => {
    if (value?.trim() !== '') {
      setIsEditingName(false);
      setName(value);
    }
  };

  return isEditingName ?
    (
      <Stack>
        <Text>Name: {value}</Text>
        <Input
          value={value} onChange={(e) => setValue(e.currentTarget.value)}
          placeholder="Enter your name" />
        <Button onClick={updateName}>Apply</Button>
      </Stack>
    ) :
    <Box>
      👋 Hello {name} <button onClick={() => setIsEditingName(true)}>✏️</button>
    </Box>;
}

export default PlayerName;