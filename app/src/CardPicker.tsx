import React from "react";

import { Button, Stack, Text } from "@chakra-ui/react";

import CardSelector from "./CardSelector";
import Card from "./models/Card";

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
      <Text fontSize="xl" fontWeight={600}>
        Story: {story}
      </Text>
      <Text>{promptText}</Text>
      <CardSelector
        cards={cards}
        onSelected={(card) => {
          setSelectedCard(card);
        }}
      />
      <Button
        mt={20}
        isActive={selectedCard !== null}
        isDisabled={selectedCard === null}
        onClick={() => onSelectedCard()}
      >
        {buttonText}
      </Button>
    </Stack>
  );
};
