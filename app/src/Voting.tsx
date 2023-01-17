import React, { useCallback, useState } from "react";

import { Text } from "@chakra-ui/react";

import { CardPicker } from "./components/CardPicker";
import { useSocket } from "./contexts/WebsocketContext";
import Card from "./models/Card";
import { useRoom } from "./contexts/RoomContext";
import CardView from "./components/CardView";

type VotingProps = {
  story: string;
  playerCards: Card[];
  storyCards: Card[];
};

export const Voting: React.FC<VotingProps> = ({
  story,
  playerCards,
  storyCards,
}: VotingProps) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [voted, setVoted] = useState<boolean>(false);
  const { roomId, lastSubmittedCard } = useRoom();
  const { sendCommand } = useSocket();

  const voteForCard = useCallback(() => {
    if (selectedCard !== null) {
      sendCommand({
        type: "player/vote",
        data: {
          roomId,
          cardId: selectedCard.cardId,
        },
      });
      setSelectedCard(null);
      setVoted(true);
    }
  }, [roomId, setVoted, sendCommand, selectedCard]);

  const content = voted ? (
    <>
      <Text>You voted for:</Text>
      {lastSubmittedCard !== -1 && (
        <CardView card={{ cardId: lastSubmittedCard }} />
      )}
    </>
  ) : (
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
    />
  );

  return content;
};
