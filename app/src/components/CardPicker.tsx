import React from "react";

import { Box, Button, Stack, Text } from "@chakra-ui/react";

import CardSelector from "./CardSelector";
import Card from "../models/Card";

type CardPickerProps = {
  story: string;
  cards: Card[];
  selectedCard: Card | null;
  setSelectedCard: (card: Card | null) => void;
  buttonText: string;
  promptText: string;
  onSelectedCard: () => void;
};

export const CardPicker: React.FC<CardPickerProps> = ({
  buttonText,
  story,
  cards,
  selectedCard,
  promptText,
  setSelectedCard,
  onSelectedCard,
}: CardPickerProps) => {
  return (
    <Stack>
      <Text fontSize="xl" fontWeight={400}>
        Story: {story}
      </Text>
      <Text>{promptText}</Text>
      <Box my="100px">
        <CardSelector
          cards={cards}
          onSelected={(card) => {
            setSelectedCard(card);
          }}
        />
      </Box>
      <Button
        mt={150}
        isActive={selectedCard !== null}
        isDisabled={selectedCard === null}
        onClick={() => onSelectedCard()}
      >
        {buttonText}
      </Button>
    </Stack>
  );
};
