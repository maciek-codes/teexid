import React, { useCallback, useEffect, useState } from "react";

import {
  Box,
  Button,
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
import { OnPlayersUpdatedPayload } from "./types";
import { CardPicker } from "./CardPicker";
import { Voting } from "./Voting";

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

type RoomState = "waiting" | "playing" | "ended";
type TurnState =
  | "not_started"
  | "waiting_for_story"
  | "selecting_cards"
  | "voting"
  | "scoring";

// Room state updated
type RoomStateUpdatedPayload = {
  id: string;
  state: RoomState;
  storyPlayerId: string;
  story: string;
  storyCardId: number;
  turnState: TurnState;
  cardsSubmitted: number[];
};

// New cards dealt
type OnCardsPayload = {
  cards: number[];
};

type StoryPromptInputProps = {
  selectedCard: Card | null;
};

const StoryPromptInput: React.FC<StoryPromptInputProps> = ({
  selectedCard,
}) => {
  const ws = useSocket();
  const [storyText, setStoryText] = useState<string>("");
  const submitStory = useCallback(() => {
    if (storyText !== "" && selectedCard !== null)
      ws.sendCommand("player/story", {
        story: storyText,
        cardId: selectedCard.cardId,
      });
  }, [ws, storyText, selectedCard]);

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
  const roomId = useRoom();
  const { addMsgListener, removeMsgListener, sendCommand } = useSocket();
  const [roomState, setRoomState] = useState<RoomState>("waiting");
  const [turnState, setTurnState] = useState<TurnState>("not_started");
  const [storyPlayerId, setStoryPlayerId] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);
  const [story, setStory] = useState<string>("");
  const [storyCards, setStoryCards] = useState<Card[] | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [players, setPlayers] = useState<Player[] | null>(null);

  const isTellingStory = storyPlayerId === player.id;
  const isPlaying = roomState === "playing";
  const isVoting = turnState === "voting";
  const isScoring = turnState === "scoring";

  const onMessage = useCallback(
    (type: string, data: unknown) => {
      if (type === "on_room_state_updated") {
        const payload = data as RoomStateUpdatedPayload;
        setRoomState(payload.state);
        setStoryPlayerId(payload.storyPlayerId);
        setStory(payload.story);
        setTurnState(payload.turnState);
        if (payload.cardsSubmitted.length > 0)
          setStoryCards(
            payload.cardsSubmitted.map((cardId) => {
              return { cardId: cardId } as Card;
            })
          );
      } else if (type === "on_cards") {
        const payload = data as OnCardsPayload;
        setCards(payload.cards.map((cardId) => ({ cardId } as Card)));
      } else if (type === "on_players_updated") {
        const payload = data as OnPlayersUpdatedPayload;
        setPlayers(payload.players);
      }
    },
    [setRoomState]
  );

  useEffect(() => {
    addMsgListener(onMessage);
    const onMessageHandler = onMessage;
    return () => {
      removeMsgListener(onMessageHandler);
    };
  }, [addMsgListener, removeMsgListener, onMessage]);

  const submitCardForStory = useCallback(() => {
    if (selectedCard !== null) {
      sendCommand("player/submitCard", {
        cardId: selectedCard.cardId,
      });
      setSelectedCard(null);
    }
  }, [sendCommand, selectedCard]);

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
      <Text>Waiting for a story</Text>
    );

  return (
    <Box>
      <Grid templateColumns="repeat(5, 1fr)" templateRows="repeat(4, 2fr)">
        <GridItem>{player.name === "" ? <PlayerName /> : null}</GridItem>
        <GridItem
          colStart={0}
          rowStart={0}
          colSpan={5}
          rowSpan={1}
          alignContent="start"
          justifyContent="start"
        >
          <Text>Player: {player.name}</Text>
          <Text>
            Room: {roomId} <CopyButton copyText={roomId} />
          </Text>
        </GridItem>

        <GridItem colStart={4} colSpan={1} rowStart={1} rowSpan={1}>
          <PlayerList />
        </GridItem>

        <GridItem colStart={0} colSpan={3} rowStart={1} rowSpan={4}>
          {roomState === "waiting" && <Text> Wait for players to join...</Text>}
          {isPlaying && turnState === "waiting_for_story" ? storyUx : null}
          {isPlaying && turnState === "selecting_cards" && !isTellingStory ? (
            <CardPicker
              cards={cards}
              story={story}
              selectedCard={selectedCard}
              setSelectedCard={setSelectedCard}
              buttonText="Submit a card"
              onSelectedCard={submitCardForStory}
            />
          ) : null}
          {isPlaying && turnState === "selecting_cards" && isTellingStory ? (
            <Text>Waiting for players to submit cards...</Text>
          ) : null}
          {isPlaying && isVoting && isTellingStory ? (
            <Text>Waiting for votes...</Text>
          ) : null}
          {isPlaying && isScoring && players ? (
            <ScoreList players={players} />
          ) : null}
          {roomState === "ended" && <Text>Ended!</Text>}
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
