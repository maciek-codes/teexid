import { Card } from "@teexid/shared";
import React, { useState } from "react";

import { Box, Stack, Text } from "@chakra-ui/react";
import { PlayerList } from "./PlayerList";
import { CardPicker } from "./components/CardPicker";
import { Voting } from "./Voting";
import PlayerScores from "./PlayerScoreList";
import { StoryInput } from "./components/StoryInput";
import { useGameStore } from "./stores/GameStore";
import { TurnResults } from "./TurnResults";
import { TurnStateDescription } from "./TurnStateDescription";
import CardView from "./components/CardView";

export const GameFeed: React.FC = () => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const playerName = useGameStore((s) => s.playerName);
  const players = useGameStore((s) => s.room.players);
  const story = useGameStore((s) => s.room.story);
  const cards = useGameStore((s) => s.room.cards);
  const cardsSubmitted = useGameStore((s) => s.room.cardsSubmitted);
  const turnState = useGameStore((s) => s.room.turnState);
  const gameState = useGameStore((s) => s.room.gameState);
  const submittedCard = useGameStore((s) => s.room.submittedCard);
  const votedForCard = useGameStore((s) => s.room.votedForCard);

  const send = useGameStore((s) => s.send);

  const player = players.find((p) => p.name === playerName);
  const isTellingStory =
    player?.status === "story_telling" || player?.status === "story_submitted";

  const storyPlayerName =
    players.find((p) => p.status === "story_telling")?.name ?? "";
  const isPlaying = turnState !== "waiting";

  const isPickingCard =
    players.find((p) => p.name === playerName)?.status === "picking_card";

  // Are we all voting
  const isVoting = turnState === "voting";

  // Send a card for the given story
  const submitCardForStory = () => {
    if (selectedCard !== null) {
      send({
        type: "submit_story_card",
        payload: {
          cardId: selectedCard.cardId,
        },
      });
      setSelectedCard(null);
    }
  };

  return (
    <Stack pt={0}>
      <Box
        backgroundColor="#ac4fc2"
        color="#F2F3ED"
        px="5"
        py="3"
        rounded="lg"
        dropShadow="10px"
      >
        <TurnStateDescription />
      </Box>
      {isPlaying && (
        <Box backgroundColor="#ebd9ff" p={2} rounded="lg">
          {isPlaying && isPickingCard && !isTellingStory && (
            <CardPicker
              cards={cards}
              story={story}
              selectedCard={selectedCard}
              setSelectedCard={setSelectedCard}
              promptText="Pick the best card that matches the story."
              buttonText="Submit a card"
              onSelectedCard={() => submitCardForStory()}
            />
          )}
          {isPlaying &&
            turnState === "guessing" &&
            (player?.status === "submitted_card" ||
              player?.status === "story_submitted") && (
              <>
                <Text>Waiting for other submit a card to vote...</Text>
                {submittedCard && (
                  <>
                    <Text>
                      You submitted this card for the story '{story}':
                    </Text>
                    <CardView card={submittedCard} />
                  </>
                )}
              </>
            )}
          {isPlaying &&
            !isTellingStory &&
            players.some((p) => p.status === "story_telling") && (
              <>
                <Text>Cards in hand:</Text>
                <CardPicker
                  cards={cards}
                  story={""}
                  promptText=""
                  buttonText=""
                  selectedCard={null}
                  setSelectedCard={() => {}}
                  onSelectedCard={() => {}}
                />
              </>
            )}
          {isPlaying && player?.status === "story_telling" && <StoryInput />}
          {isPlaying &&
            isVoting &&
            cardsSubmitted &&
            cardsSubmitted?.length !== null && (
              <Voting
                story={story}
                playerCards={cards}
                storyCards={cardsSubmitted}
              />
            )}
          {isPlaying &&
            isVoting &&
            (player?.status === "vote_submitted" ||
              player?.status === "story_submitted") && (
              <>
                <Text>Waiting for other players to vote...</Text>
                {votedForCard && (
                  <>
                    <Text>
                      You voted for this card for the story '{story}':
                    </Text>
                    <CardView card={votedForCard} />
                  </>
                )}
              </>
            )}
          {isPlaying && turnState === "finished" && <TurnResults />}
        </Box>
      )}
      {gameState === "finished" && (
        <Box>
          <PlayerScores playersList={players} />
        </Box>
      )}
      <PlayerList />
    </Stack>
  );
};
