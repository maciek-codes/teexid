import React, { useCallback, useState } from "react";

import { Text } from "@chakra-ui/react";

import { CardPicker } from "./CardPicker";
import { useSocket } from "./contexts/WebsocketContext";
import Card from "./models/Card";
import { useRoom } from "./contexts/RoomContext";
import CardView from "./CardView";

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
  const [votedCardId, setVotedCardId] = useState<number | null>(null);
  const { roomId } = useRoom();
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
      setVotedCardId(selectedCard.cardId);
    }
  }, [roomId, setVotedCardId, sendCommand, selectedCard]);

  const content =
    votedCardId !== null ? (
      <>
        <Text>You voted for:</Text>
        <CardView card={{ cardId: votedCardId }} />
      </>
    ) : (
      <CardPicker
        cards={storyCards.filter(
          (card) =>
            !playerCards.map((card) => card.cardId).includes(card.cardId)
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
