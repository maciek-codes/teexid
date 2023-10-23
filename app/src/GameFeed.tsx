import React, { useState } from "react";

import { Box, Stack, Text } from "@chakra-ui/react";
import { PlayerList } from "./PlayerList";
import { useRoomStore } from "./stores/RoomStore";
import Card from "./models/Card";
import { CardPicker } from "./components/CardPicker";
import { Voting } from "./Voting";
import PlayerScores from "./PlayerScoreList";
import GameLog from "./components/GameLog";
import CardView from "./components/CardView";
import { useSubmitCard } from "./queries/useSubmitCard";
import { StoryInput } from "./components/StoryInput";
import { useGameStore } from "./stores/GameStore";

export const GameFeed: React.FC = () => {
  const [playerId, playerName] = useGameStore((s) => [
    s.playerId,
    s.playerName,
  ]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const players = useGameStore((state) => state.room.players);
  const gameState = useGameStore((state) => state.room.gameState);

  const story = useRoomStore((state) => state.story);
  const cards = useRoomStore((state) => state.cards);
  const storyCards = useRoomStore((state) => state.storyCards);
  const turnNumber = useRoomStore((state) => state.turnNumber);

  const submitQuery = useSubmitCard(turnNumber);

  const isTellingStory =
    players.find((p) => p.name === playerName)?.status === "story_telling";

  const storyPlayerName =
    players.find((p) => p.status === "story_telling")?.name ?? "";
  const isPlaying = gameState !== "waiting";
  const isVoting = gameState === "voting";

  const submitCardForStory = () => {
    if (selectedCard !== null) {
      submitQuery.mutate(selectedCard.cardId);
      setSelectedCard(null);
    }
  };

  return (
    <Stack pt={0}>
      {/* What's happening in the room*/}
      <Box
        backgroundColor="#ac4fc2"
        color="#F2F3ED"
        px="5"
        py="3"
        rounded="lg"
        dropShadow="10px"
      >
        {gameState === "waiting" && (
          <Text flexGrow={2} align="center" fontSize="xl">
            Wait for players to join...
          </Text>
        )}
        {isPlaying && gameState !== "waiting" && (
          <Text fontSize="x-large" align="center">
            Turn {turnNumber}:
          </Text>
        )}
        {isPlaying && isTellingStory && gameState !== "waiting" && (
          <Text fontSize="lg">Pick a card and type your story:</Text>
        )}
        {isPlaying && isTellingStory && gameState !== "waiting" && (
          <Text fontSize="lg">You are the story teller.</Text>
        )}
        {isPlaying && !isTellingStory && gameState === "waiting" && (
          <Text textAlign="center">
            Waiting for <Text as="b">{storyPlayerName}</Text> to write a story
            and pick a card.
          </Text>
        )}
        {isPlaying && !isTellingStory && gameState === "selecting_cards" && (
          <Text textAlign="center">Now you select a card for the story.</Text>
        )}
        {isPlaying && gameState === "voting" && (
          <Text fontSize="xl">Voting!</Text>
        )}
        {gameState === "finished" && <Text fontSize="xl">Game ended!</Text>}
      </Box>
      {isPlaying && (
        <Box backgroundColor="#ebd9ff" p={2} rounded="lg">
          {isPlaying &&
            gameState === "selecting_cards" &&
            !isTellingStory &&
            submitQuery.isIdle && (
              <CardPicker
                cards={cards}
                story={story}
                selectedCard={selectedCard}
                setSelectedCard={setSelectedCard}
                promptText="Pick a card"
                buttonText="Submit a card"
                onSelectedCard={() => submitCardForStory()}
              />
            )}
          {isPlaying &&
            !isTellingStory &&
            players.some((p) => p.status === "story_telling") && (
              <Text>Waiting for the story teller...</Text>
            )}
          {isPlaying &&
            gameState === "selecting_cards" &&
            !isTellingStory &&
            submitQuery.isSuccess && (
              <>
                <Text fontSize="lg" mb={5}>
                  You submitted this card for the "<Text as="em">{story}</Text>"
                  story
                </Text>
                <CardView
                  card={{ cardId: submitQuery.data.submittedCard } as Card}
                />
              </>
            )}
          {isPlaying && isTellingStory && <StoryInput />}
          {isPlaying &&
            isVoting &&
            !isTellingStory &&
            storyCards &&
            storyCards?.length !== null && (
              <Voting
                story={story}
                playerCards={cards}
                storyCards={storyCards}
                turnNumber={turnNumber}
              />
            )}
        </Box>
      )}
      {gameState === "ended" && (
        <Box>
          <PlayerScores playersList={players} />
        </Box>
      )}
      <PlayerList />
      <GameLog />
    </Stack>
  );
};
