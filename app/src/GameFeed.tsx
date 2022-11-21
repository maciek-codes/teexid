import React, { useCallback, useState } from "react";

import {
  Box,
  Button,
  Center,
  Grid,
  GridItem,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { PlayerList } from "./PlayerList";
import PlayerName from "./PlayerName";
import { usePlayer } from "./contexts/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRoom } from "./contexts/RoomContext";
import { useSocket } from "./contexts/WebsocketContext";
import CardSelector from "./CardSelector";
import Card from "./models/Card";
import Player from "./models/Player";
import { CardPicker } from "./CardPicker";
import { Voting } from "./Voting";
import PlayerScores from "./PlayerScoreList";
import CardView from "./CardView";

interface CopyButtonProps {
  copyText: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  copyText,
}: CopyButtonProps) => {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(copyText);
      }}
    >
      <FontAwesomeIcon icon={["far", "copy"]} />
    </button>
  );
};

type StoryPromptInputProps = {
  selectedCard: Card | null;
};

const StoryPromptInput: React.FC<StoryPromptInputProps> = ({
  selectedCard,
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
    <Stack>
      <HStack>
        <Text>Type story: </Text>
        <Input
          type="text"
          placeholder="Be creative!"
          onChange={(e) => setStoryText(e.currentTarget.value)}
        />
      </HStack>
      <Button
        isActive={storyText.trim() !== "" && selectedCard !== null}
        isDisabled={storyText.trim() === "" || selectedCard === null}
        onClick={() => submitStory()}
      >
        Submit story
      </Button>
    </Stack>
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
      <Box>
        <StoryPromptInput selectedCard={selectedCard} />
        <CardSelector
          cards={cards}
          onSelected={(selectedCard) => {
            setSelectedCard(selectedCard);
          }}
        />
      </Box>
    ) : (
      <Center>
        <Text textAlign="center">
          Waiting for {storyPlayerName} to write a story and pick a card.
        </Text>
      </Center>
    );

  return (
    <Box>
      <Grid templateRows="20px 1fr 20px" templateColumns="2fr 150px">
        <GridItem>{player.name === "" ? <PlayerName /> : null}</GridItem>
        <GridItem
          colStart={5}
          colSpan={1}
          rowStart={0}
          rowSpan={1}
          alignContent="start"
          justifyContent="start"
        >
          <Text>Player: {player.name}</Text>
          <Text>
            Room: {roomId} <CopyButton copyText={roomId} />
          </Text>
        </GridItem>

        <GridItem colStart={5} colSpan={1} rowStart={2} rowSpan={1}>
          <PlayerList />
        </GridItem>

        <GridItem colStart={0} colSpan={4} rowStart={1} rowSpan={4}>
          {roomState === "waiting" && <Text> Wait for players to join...</Text>}
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
            <Text>Waiting for players to submit cards...</Text>
          ) : null}
          {isPlaying && isVoting && isTellingStory ? (
            <Stack>
              <Text>Waiting for votes...</Text>
              <CardSelector onSelected={() => {}} cards={storyCards} />
            </Stack>
          ) : null}
          {isPlaying && isScoring && players ? (
            <ScoreList players={players} />
          ) : null}
          {roomState === "ended" && (
            <Box>
              <Text>Ended!</Text>
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
        </GridItem>
      </Grid>
    </Box>
  );
};
