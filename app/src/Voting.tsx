import React, { useCallback, useState } from "react";

import {Text} from "@chakra-ui/react"

import { CardPicker } from "./CardPicker";
import { useSocket } from "./contexts/WebsocketContext";
import Card from "./models/Card";


type VotingProps = {
  story: string;
  playerCards: Card[];
  storyCards: Card[];
};

export const Voting: React.FC<VotingProps> = ({story, playerCards, storyCards}: VotingProps) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [voted, setVoted] = useState<boolean>(false);
  const { sendCommand } = useSocket();

  const voteForCard = useCallback(() => {
    if (selectedCard !== null) {
      sendCommand("player/vote", {
        cardId: selectedCard.cardId,
      });
      setSelectedCard(null);
      setVoted(true);
    }
  }, [setVoted, sendCommand, selectedCard]);
  
  const content = voted ? <Text>Already voted</Text> :
    <CardPicker
      cards={storyCards.filter(
        (card) => !playerCards.map((card) => card.cardId).includes(card.cardId)
      )}
      story={story}
      selectedCard={selectedCard}
      setSelectedCard={setSelectedCard}
      promptText="Select the card you want to vote for"
      buttonText="Vote"
      onSelectedCard={voteForCard}
    />;

    return content;
};
