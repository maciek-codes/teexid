import React, { useState } from "react";

import { Box, Center, Stack, Text } from "@chakra-ui/react";
import { PlayerList } from "./PlayerList";
import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import Card from "./models/Card";
import Player from "./models/Player";
import { CardPicker } from "./components/CardPicker";
import { Voting } from "./Voting";
import PlayerScores from "./PlayerScoreList";
import GameLog from "./components/GameLog";
import CardView from "./components/CardView";
import DebugInfo from "./components/DebugInfo";
import { useSubmitCard } from "./queries/useSubmitCard";
import { StoryInput } from "./components/StoryInput";

type ScoreListProps = {
  players: Player[];
};

const ScoreList: React.FC<ScoreListProps> = ({ players }: ScoreListProps) => {
  const playerScores = players
    .sort((a: Player, b: Player): number => {
      return a.points === b.points ? 0 : a.points < b.points ? -1 : 1;
    })
    .map((player, idx) => {
      return (
        <Text key={idx}>
          {player.name}: {player.points} pt
        </Text>
      );
    });
  return <>{playerScores}</>;
};

export const GameFeed: React.FC = () => {
  const player = usePlayer();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const {
    story,
    players,
    cards,
    storyCards,
    storyPlayerId,
    roomState,
    turnState,
  } = useRoom();

  const submitQuery = useSubmitCard();

  const isTellingStory = storyPlayerId === player.id;
  const storyPlayerName = players.find((p) => p.id === storyPlayerId)?.name;
  const isPlaying = roomState === "playing";
  const isVoting = turnState === "voting";
  const isScoring = turnState === "scoring";

  const submitCardForStory = () => {
    if (selectedCard !== null) {
      submitQuery.mutate(selectedCard.cardId);
      setSelectedCard(null);
    }
  };

  const storyUx = (
    <Center>
      <Text textAlign="center">
        Waiting for <Text as="b">{storyPlayerName}</Text> to write a story and
        pick a card.
      </Text>
    </Center>
  );

  return (
    <Stack>
      {roomState === "waiting" && (
        <Text flexGrow={2} align="center" fontSize="xl">
          Wait for players to join...
        </Text>
      )}
      {isPlaying &&
        !isTellingStory &&
        turnState === "waiting_for_story" &&
        storyUx}
      {isPlaying &&
        turnState === "selecting_cards" &&
        !isTellingStory &&
        submitQuery.isIdle && (
          <CardPicker
            cards={cards}
            story={story}
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
            promptText="Submit a card for this story"
            buttonText="Submit a card"
            onSelectedCard={() => submitCardForStory()}
          />
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
      {isPlaying && isScoring && players && <ScoreList players={players} />}
      {roomState === "ended" && (
        <Box>
          <Text fontSize="xl">Game ended!</Text>
          <PlayerScores playersList={players} />
        </Box>
      )}
      {isPlaying &&
      isVoting &&
      !isTellingStory &&
      storyCards &&
      storyCards?.length !== null ? (
        <Voting story={story} playerCards={cards} storyCards={storyCards} />
      ) : null}
      <PlayerList />
      <GameLog />
      <DebugInfo />
    </Stack>
  );
};
