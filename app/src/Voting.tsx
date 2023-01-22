import React, { useState } from "react";

import { Progress, Stack, Text } from "@chakra-ui/react";

import { CardPicker } from "./components/CardPicker";
import Card from "./models/Card";
import CardView from "./components/CardView";
import { useVote } from "./queries/useVote";

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
  const useVoteQuery = useVote();

  const voteForCard = () => {
    if (selectedCard !== null) {
      useVoteQuery.mutate({ cardId: selectedCard.cardId });
      setSelectedCard(null);
    }
  };

  if (useVoteQuery.isSuccess) {
    return (
      <>
        <Text>You voted for:</Text>
        {useVoteQuery.data.cardId !== -1 && (
          <CardView card={{ cardId: useVoteQuery.data.cardId }} />
        )}
      </>
    );
  }

  if (useVoteQuery.isLoading) {
    return (
      <Stack>
        <Text>Voting...</Text>
        <Progress isIndeterminate={true} />
      </Stack>
    );
  }

  return (
    <CardPicker
      cards={storyCards.filter(
        (card) => !playerCards.map((card) => card.cardId).includes(card.cardId)
      )}
      story={story}
      selectedCard={selectedCard}
      setSelectedCard={setSelectedCard}
      promptText="Select the card you want to vote for:"
      buttonText="Vote"
      onSelectedCard={voteForCard}
    />
  );
};
