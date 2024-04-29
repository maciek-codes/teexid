import { Flex } from "@chakra-ui/react";
import { Card } from "@teexid/shared";
import { useState } from "react";

import CardView from "./CardView";

interface CardSelectorProps {
  cards: Array<Card>;
  onSelected?: (selectedCard: Card | null) => void;
}

const CardSelector = ({ cards, onSelected }: CardSelectorProps) => {
  const [selectedId, setSelectedId] = useState(-1);

  var cardViews = cards.map((card, idx) => {
    return (
      <CardView
        card={card}
        onClick={(selectedCard: Card) => {
          if (selectedId === selectedCard.cardId) {
            setSelectedId(-1);
            if (onSelected) {
              onSelected(null);
            }
            return;
          }
          setSelectedId(selectedCard.cardId);
          if (onSelected) {
            onSelected(selectedCard);
          }
        }}
        key={idx}
        selected={card.cardId === selectedId}
      />
    );
  });
  return (
    <Flex
      flexDirection="row"
      gap="10px"
      py={5}
      justifyItems="center"
      alignItems="stretch"
      overflowX="auto"
    >
      {cardViews}
    </Flex>
  );
};

export default CardSelector;
