import React, { useCallback, useEffect, useState } from "react";

import { Box, Center, Stack, Text } from "@chakra-ui/react";
import { PlayerList } from "./PlayerList";
import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import { useSocket } from "./contexts/WebsocketContext";
import CardSelector from "./components/CardSelector";
import Card from "./models/Card";
import StoryInput from "./components/StoryInput";
import Player from "./models/Player";
import { CardPicker } from "./components/CardPicker";
import { Voting } from "./Voting";
import PlayerScores from "./PlayerScoreList";
import GameLog from "./components/GameLog";
import CardView from "./components/CardView";
import DebugInfo from "./components/DebugInfo";
import { useSubmitCard } from "./queries/useSubmitCard";

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
  const { sendCommand } = useSocket();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const {
    roomId,
    story,
    players,
    cards,
    storyCards,
    storyPlayerId,
    roomState,
    turnState,
    lastSubmittedCard,
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

  const storyUx =
    isPlaying && turnState === "waiting_for_story" && isTellingStory ? (
      <StoryInput
        selectedCard={selectedCard}
        cards={cards}
        setSelectedCard={setSelectedCard}
      />
    ) : (
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
          {" "}
          Wait for players to join...
        </Text>
      )}
      {isPlaying && turnState === "waiting_for_story" ? storyUx : null}
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
      {isPlaying && isTellingStory && (
        <>
          <Text fontSize="lg" mb={5}>
            You submitted the story: <Text as="em">{story}</Text>
          </Text>
          {lastSubmittedCard !== -1 && (
            <>
              <Text fontSize="lg" mb={5}>
                Your story card:
              </Text>
              <CardView card={{ cardId: lastSubmittedCard ?? "-1" } as Card} />
            </>
          )}
        </>
      )}
      {isPlaying && turnState === "selecting_cards" && isTellingStory ? (
        <Text fontSize="md">Waiting for players to submit cards...</Text>
      ) : null}
      {isPlaying && isVoting && isTellingStory && (
        <>
          <Text fontSize="xl">Waiting for votes... {"\n"}Cards submitted:</Text>
          <CardSelector
            onSelected={() => {}}
            cards={storyCards.filter((c) => c.cardId !== lastSubmittedCard)}
          />
        </>
      )}
      {isPlaying && isScoring && players ? (
        <ScoreList players={players} />
      ) : null}
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
