import { Card } from "@teexid/shared";
import React, { useState } from "react";

import { Box, Stack, Text } from "@chakra-ui/react";
import { PlayerList } from "./PlayerList";
import { CardPicker } from "./components/CardPicker";
import { Voting } from "./Voting";
import PlayerScores from "./PlayerScoreList";
import CardView from "./components/CardView";
import { StoryInput } from "./components/StoryInput";
import { useGameStore } from "./stores/GameStore";
import { TurnResults } from "./TurnResults";

export const GameFeed: React.FC = () => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const playerName = useGameStore((s) => s.playerName);
  const players = useGameStore((s) => s.room.players);
  const story = useGameStore((s) => s.room.story);
  const cards = useGameStore((s) => s.room.cards);
  const cardsSubmitted = useGameStore((s) => s.room.cardsSubmitted);
  const turnState = useGameStore((s) => s.room.turnState);
  const turnNumber = useGameStore((s) => s.room.turnNumber);
  const gameState = useGameStore((s) => s.room.gameState);

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
        {turnState === "waiting" && (
          <Text flexGrow={2} align="center" fontSize="xl">
            Wait for players to join...
          </Text>
        )}
        {isPlaying && turnState !== "finished" && (
          <Text fontSize="x-large" align="center">
            Turn {turnNumber}:
          </Text>
        )}
        {isPlaying && isTellingStory && turnState === "guessing" && (
          <>
            <Text fontSize="lg">Others are guessing. Cards submitted:</Text>
            <>
              {cardsSubmitted.map((card, idx) => (
                <CardView card={card} key={idx} />
              ))}
            </>
          </>
        )}
        {isPlaying &&
          player?.status === "story_telling" &&
          turnState !== "finished" && (
            <Text fontSize="lg">Pick a card and type your story.</Text>
          )}
        {isPlaying && isTellingStory && turnState !== "finished" && (
          <Text fontSize="lg">You are the story teller.</Text>
        )}
        {isPlaying && !isTellingStory && turnState === "waiting_for_story" && (
          <Text textAlign="center">
            Waiting for <Text as="b">{storyPlayerName}</Text> to write a story
            and pick a card.
          </Text>
        )}
        {isPlaying && !isTellingStory && isPickingCard && (
          <Text textAlign="center">Now you select a card for the story.</Text>
        )}
        {isPlaying && player?.status === "story_submitted" && isPickingCard && (
          <Text textAlign="center">
            Waiting for other to pick cards for your story.
          </Text>
        )}
        {isPlaying && turnState === "voting" && (
          <Text fontSize="xl">Voting...</Text>
        )}
        {isPlaying && turnState === "finished" && (
          <Text fontSize="xl">Round {turnNumber} ended!</Text>
        )}
        {gameState === "finished" && <Text fontSize="xl">Game ended!</Text>}
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
          {/*
          {isPlaying &&
            turnState === "selecting_cards" &&
            !isTellingStory &&
            <>
              <Text fontSize="lg" mb={5}>
                You submitted this card for the "<Text as="em">{story}</Text>"
                story
              </Text>
              <CardView
                card={{ cardId: submitQuery.data.submittedCard } as Card}
              />
          </>}
          */}
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
