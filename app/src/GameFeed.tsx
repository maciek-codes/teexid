import React, { useCallback, useState } from "react";

import {
  Box,
  Button,
  Center,
  Flex,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { PlayerList } from "./PlayerList";
import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import { useSocket } from "./contexts/WebsocketContext";
import CardSelector from "./CardSelector";
import Card from "./models/Card";
import Player from "./models/Player";
import { CardPicker } from "./CardPicker";
import { Voting } from "./Voting";
import PlayerScores from "./PlayerScoreList";

type StoryPromptInputProps = {
  cards: Array<Card>;
  selectedCard: Card | null;
  setSelectedCard: (c: Card | null) => void;
};

const StoryPromptInput: React.FC<StoryPromptInputProps> = ({
  cards,
  selectedCard,
  setSelectedCard,
}) => {
  const { sendCommand } = useSocket();
  const { roomId } = useRoom();
  const [storyText, setStoryText] = useState<string>("");
  const submitStory = useCallback(() => {
    if (storyText !== "" && selectedCard !== null)
      sendCommand({
        type: "player/story",
        data: {
          roomId,
          story: storyText,
          cardId: selectedCard.cardId,
        },
      });
  }, [roomId, sendCommand, storyText, selectedCard]);

  return (
    <Flex flexDirection="column" alignItems="start" justifyContent="start">
      <Text fontSize="lg" mt={5} mb={10}>
        Pick a card a and type your story:{" "}
      </Text>
      <CardSelector
        cards={cards}
        onSelected={(selectedCard) => {
          setSelectedCard(selectedCard);
        }}
      />
      <Input
        type="text"
        background="white"
        placeholder="Be creative!"
        onChange={(e) => setStoryText(e.currentTarget.value)}
        mt={5}
        mb={10}
      />
      <Button
        isActive={storyText.trim() !== "" && selectedCard !== null}
        isDisabled={storyText.trim() === "" || selectedCard === null}
        onClick={() => submitStory()}
      >
        Submit story
      </Button>
    </Flex>
  );
};

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
  } = useRoom();

  const isTellingStory = storyPlayerId === player.id;
  const storyPlayerName = players.find((p) => p.id === storyPlayerId)?.name;
  const isPlaying = roomState === "playing";
  const isVoting = turnState === "voting";
  const isScoring = turnState === "scoring";

  const submitCardForStory = useCallback(() => {
    if (selectedCard !== null) {
      sendCommand({
        type: "player/submitCard",
        data: {
          roomId,
          cardId: selectedCard.cardId,
        },
      });
      setSelectedCard(null);
    }
  }, [roomId, sendCommand, selectedCard]);

  const storyUx =
    isPlaying && turnState === "waiting_for_story" && isTellingStory ? (
      <StoryPromptInput
        selectedCard={selectedCard}
        cards={cards}
        setSelectedCard={setSelectedCard}
      />
    ) : (
      <Center>
        <Text textAlign="center">
          Waiting for {storyPlayerName} to write a story and pick a card.
        </Text>
      </Center>
    );

  return (
    <Flex flexWrap="wrap" px={5}>
      <Flex
        flexGrow={3}
        flexShrink={1}
        justifyContent="center"
        alignItems="center"
      >
        {roomState === "waiting" && (
          <Text flexGrow={2} align="center" fontSize="xl">
            {" "}
            Wait for players to join...
          </Text>
        )}
        {isPlaying && turnState === "waiting_for_story" ? storyUx : null}
        {isPlaying && turnState === "selecting_cards" && !isTellingStory ? (
          <CardPicker
            cards={cards}
            story={story}
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
            promptText="Submit a card for this story"
            buttonText="Submit a card"
            onSelectedCard={submitCardForStory}
          />
        ) : null}
        {isPlaying && turnState === "selecting_cards" && isTellingStory ? (
          <Box>
            <Text fontSize="lg" mb={5}>
              Your story: {story}
            </Text>
            <Text fontSize="md">Waiting for players to submit cards...</Text>
          </Box>
        ) : null}
        {isPlaying && isVoting && isTellingStory ? (
          <Stack>
            <Text fontSize="xl">Waiting for votes... Cards submitted:</Text>
            <CardSelector onSelected={() => {}} cards={storyCards} />
          </Stack>
        ) : null}
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
      </Flex>
      {/** Right panel */}
      <Flex
        flexGrow={1}
        flexShrink={3}
        flexDirection="column"
        flexBasis="250px"
      >
        <PlayerList />
      </Flex>
    </Flex>
  );
};
