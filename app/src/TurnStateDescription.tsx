import React from "react";

import { Text } from "@chakra-ui/react";

import { useGameStore } from "./stores/GameStore";
import CardView from "./components/CardView";

export const TurnStateDescription = (): JSX.Element => {
  const turnState = useGameStore((s) => s.room.turnState);
  const turnNumber = useGameStore((s) => s.room.turnNumber);
  const players = useGameStore((s) => s.room.players);
  const playerName = useGameStore((s) => s.playerName);
  const player = players.find((p) => p.name === playerName);
  const isPickingCard =
    players.find((p) => p.name === playerName)?.status === "picking_card";
  const cardsSubmitted = useGameStore((s) => s.room.cardsSubmitted);
  const gameState = useGameStore((s) => s.room.gameState);

  const isTellingStory =
    player?.status === "story_telling" || player?.status === "story_submitted";

  const storyPlayerName =
    players.find((p) => p.status === "story_telling")?.name ?? "";

  const isPlaying = turnState !== "waiting";

  return (
    <>
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
          <Text fontSize="lg">Others are submitting cards for the story.</Text>
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
          Waiting for <Text as="b">{storyPlayerName}</Text> to write a story and
          pick a card.
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
    </>
  );
};
