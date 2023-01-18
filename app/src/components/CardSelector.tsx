import { Flex } from "@chakra-ui/react";
import { useState } from "react";
import CardView from "./CardView";
import Card from "../models/Card";

interface CardSelectorProps {
  cards: Array<Card>;
  onSelected: (selectedCard: Card | null) => void;
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
            onSelected(null);
            return;
          }
          setSelectedId(selectedCard.cardId);
          onSelected(selectedCard);
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
      justifyItems="center"
      alignItems="stretch"
    >
      {cardViews}
    </Flex>
  );
};

export default CardSelector;