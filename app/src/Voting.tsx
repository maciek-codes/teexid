import React, { useCallback, useState } from "react";

import { Progress, Stack, Text } from "@chakra-ui/react";
import { Card } from "@teexid/shared";

import { CardPicker } from "./components/CardPicker";
import CardView from "./components/CardView";
import { useWebsocketContext } from "./context/WebsocketContextProvider";
import { useGameStore } from "./stores/GameStore";

type VotingProps = {
  story: string;
  playerCards: Card[];
  storyCards: Card[];
};

export const Voting = ({
  story,
  playerCards,
  storyCards,
}: VotingProps): JSX.Element | null => {
  const players = useGameStore((s) => s.room.players);
  const playerName = useGameStore((s) => s.playerName);
  const canPlayerVote =
    players.find((p) => p.name === playerName)?.status === "voting";

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [votedCard, setVotedCard] = useState<Card | null>(null);
  const [voted, setVoted] = useState<boolean>(false);
  const { send } = useWebsocketContext();

  const voteForCard = useCallback(() => {
    if (selectedCard !== null) {
      send({
        type: "vote",
        payload: {
          cardId: selectedCard.cardId,
        },
      });
      setSelectedCard(null);
      setVotedCard({
        cardId: selectedCard.cardId,
      });
      setVoted(true);
    }
  }, [setVoted, selectedCard, send]);

  if (!canPlayerVote) {
    return null;
  }

  if (voted && votedCard) {
    return (
      <>
        <Text>You voted for:</Text>
        <CardView card={{ cardId: votedCard.cardId }} />
      </>
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
