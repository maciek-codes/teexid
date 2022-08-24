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
  onSelectedCard: () => void;
};

export const CardPicker: React.FC<CardPickerProps> = ({
  buttonText,
  story,
  cards,
  selectedCard,
  setSelectedCard,
  onSelectedCard,
}: CardPickerProps) => {
  return (
    <Stack>
      <Text>Story: {story}</Text>
      <Text>Submit a card for this story</Text>
      <CardSelector
        cards={cards}
        onSelected={(card) => {
          setSelectedCard(card);
        }}
      />
      <Button
        isActive={selectedCard !== null}
        isDisabled={selectedCard === null}
        onClick={() => onSelectedCard()}
      >
        {buttonText}
      </Button>
    </Stack>
  );
};
