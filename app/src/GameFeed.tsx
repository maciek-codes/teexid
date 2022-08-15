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
import { ResponseMsg } from "./types";
import CardView from "./CardView";
import CardSelector from "./CardSelector";
import Card from "./models/Card";

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
type TurnState = "not_started" | "waiting_for_story" | "voting" | "scoring";

// Room state updated
type RoomStateUpdatedPayload = {
  id: string;
  state: RoomState;
  storyPlayerId: string;
  story: string;
  storyCardId: number;
  turnState: TurnState;
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

export const GameFeed: React.FC = () => {
  const player = usePlayer();
  const roomId = useRoom();
  const { ws, sendCommand } = useSocket();
  const [roomState, setRoomState] = useState<RoomState>("waiting");
  const [turnState, setTurnState] = useState<TurnState>("not_started");
  const [storyPlayerId, setStoryPlayerId] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);
  const [story, setStory] = useState<string>("");
  const [storyCard, setStoryCard] = useState<Card | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const onMessage = useCallback(
    (evt: MessageEvent<string>) => {
      const msg = JSON.parse(evt.data) as ResponseMsg<unknown>;
      if (msg.type === "onroomstateupdated") {
        const payload = msg.payload as RoomStateUpdatedPayload;
        setRoomState(payload.state);
        setStoryPlayerId(payload.storyPlayerId);
        setStory(payload.story);
        setTurnState(payload.turnState);
        if (payload.storyCardId > 0)
          setStoryCard({ cardId: payload.storyCardId } as Card);
      } else if (msg.type === "on_cards") {
        const payload = msg.payload as OnCardsPayload;
        setCards(payload.cards.map((cardId) => ({ cardId } as Card)));
      }
    },
    [setRoomState]
  );

  ws.addEventListener("message", onMessage);

  useEffect(() => {
    const onMessageHandler = onMessage;
    const wsRef = ws;
    return () => {
      wsRef.removeEventListener("message", onMessageHandler);
    }
  }, [ws, onMessage]);

  const voteForStory = useCallback(() => {
    if (selectedCard !== null)
      sendCommand("player/vote", {
        cardId: selectedCard.cardId,
      });
  }, [sendCommand, selectedCard]);

  const storyUx = roomState === "playing" && turnState === "waiting_for_story" && 
    storyPlayerId === player.id ? 
    (<StoryPromptInput selectedCard={selectedCard} />) :
    (<Text>Waiting for a story</Text>);
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
          {roomState === "playing" && turnState === "waiting_for_story" ? 
            storyUx : null
          }
          {roomState === "playing" && turnState === "voting" ? 
              <Stack>
                <Text>Submit a card for this story</Text>
                <CardSelector
                  cards={cards}
                  onSelected={(selectedCard) => {
                    setSelectedCard(selectedCard);
                  }}
                />
                 <Button
                    isActive={selectedCard !== null}
                    isDisabled={selectedCard === null}
                    onClick={() => voteForStory()}
                  >
                    Vote
                  </Button>
              </Stack> : null
          }
          {roomState === "playing" && turnState === "voting" ? 
              <Stack>
                <Text>Submit a card for this story</Text>
                <CardSelector
                cards={cards}
                onSelected={(selectedCard) => {
                  setSelectedCard(selectedCard);
                }}
              />
              </Stack> : null
          }
          {roomState === "ended" && <Text>Ended!</Text>}
          {story !== "" ? <Text>Story: {story}</Text> : null}
          {storyCard !== null ? (
          <>
            <Text>Story card was:</Text>
            <CardView card={storyCard} />
          </>): null}
        </GridItem>
      </Grid>
    </Box>
  );
};
