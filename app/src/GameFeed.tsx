import React, { useState } from "react";

import { Box, Stack, Text } from "@chakra-ui/react";
import { PlayerList } from "./PlayerList";
import { usePlayerStore } from "./stores/PlayerStore";
import { useRoomStore } from "./stores/RoomStore";
import Card from "./models/Card";
import { CardPicker } from "./components/CardPicker";
import { Voting } from "./Voting";
import PlayerScores from "./PlayerScoreList";
import GameLog from "./components/GameLog";
import CardView from "./components/CardView";
import { useSubmitCard } from "./queries/useSubmitCard";
import { StoryInput } from "./components/StoryInput";

export const GameFeed: React.FC = () => {
  const { id: playerId } = usePlayerStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const story = useRoomStore((state) => state.story);
  const players = useRoomStore((state) => state.players);
  const cards = useRoomStore((state) => state.cards);
  const storyCards = useRoomStore((state) => state.storyCards);
  const storyPlayerId = useRoomStore((state) => state.storyPlayerId);
  const roomState = useRoomStore((state) => state.roomState);
  const turnState = useRoomStore((state) => state.turnState);
  const turnNumber = useRoomStore((state) => state.turnNumber);

  const submitQuery = useSubmitCard(turnNumber);

  const isTellingStory = storyPlayerId === playerId;
  const storyPlayerName = players.find((p) => p.id === storyPlayerId)?.name;
  const isPlaying = roomState === "playing";
  const isVoting = turnState === "voting";

  const submitCardForStory = () => {
    if (selectedCard !== null) {
      submitQuery.mutate(selectedCard.cardId);
      setSelectedCard(null);
    }
  };

  return (
    <Stack pt={0} w="md">
      {/* What's happening in the room*/}
      <Box
        backgroundColor="#ac4fc2"
        color="#F2F3ED"
        px="5"
        py="3"
        rounded="lg"
        dropShadow="10px"
      >
        {roomState === "waiting" && (
          <Text flexGrow={2} align="center" fontSize="xl">
            Wait for players to join...
          </Text>
        )}
        {isPlaying && turnState !== "not_started" && (
          <Text fontSize="x-large" align="center">
            Turn {turnNumber}:
          </Text>
        )}
        {isPlaying && isTellingStory && turnState === "waiting_for_story" && (
          <Text fontSize="lg">Pick a card and type your story:</Text>
        )}
        {isPlaying && isTellingStory && turnState !== "waiting_for_story" && (
          <Text fontSize="lg">You are the story teller.</Text>
        )}
        {isPlaying && !isTellingStory && turnState === "waiting_for_story" && (
          <Text textAlign="center">
            Waiting for <Text as="b">{storyPlayerName}</Text> to write a story
            and pick a card.
          </Text>
        )}
        {isPlaying && !isTellingStory && turnState === "selecting_cards" && (
          <Text textAlign="center">Now you select a card for the story.</Text>
        )}
        {isPlaying && turnState === "voting" && (
          <Text fontSize="xl">Voting!</Text>
        )}
        {roomState === "ended" && <Text fontSize="xl">Game ended!</Text>}
      </Box>
      {isPlaying && (
        <Box backgroundColor="#ebd9ff" p={2} rounded="lg">
          {isPlaying &&
            turnState === "selecting_cards" &&
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
            turnState === "waiting_for_story" && (
              <Text>Waiting for the story teller...</Text>
            )}
          {isPlaying &&
            turnState === "selecting_cards" &&
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
      {roomState === "ended" && (
        <Box>
          <PlayerScores playersList={players} />
        </Box>
      )}
      <PlayerList />
      <GameLog />
    </Stack>
  );
};
