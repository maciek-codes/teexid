import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import React from "react";
import CardView from "./CardView";
import { useRoomStore } from "../stores/RoomStore";
import Card from "../models/Card";
import Player from "../models/Player";
import { GameLogEntry } from "../types";

type GameLogItemProps = {
  logEntry: GameLogEntry;
  playerMap: Map<string, Player>;
  roundNo: number;
};

const GameLogItem: React.FC<GameLogItemProps> = ({
  logEntry,
  playerMap,
  roundNo,
}: GameLogItemProps) => {
  const cards = Array.from(logEntry.cardsSubmitted.values());

  const cardVotes = cards.map((card, cardIdx) => {
    if (card.playerSubmitted === logEntry.storyPlayerId) {
      return null;
    }

    // Check who voted for this card
    const playerSubmitted = playerMap.get(card.playerSubmitted)?.name ?? "???";
    const players = card.playersVoted.map(
      (playerId) => playerMap.get(playerId)?.name ?? "???"
    );
    const addPointsForVotes = !logEntry.allVotesForStory;

    return (
      <Box pt={10} key={cardIdx}>
        <HStack>
          <Text as="b">{playerSubmitted}</Text>
          <Text ml={1}>submitted card:</Text>
        </HStack>
        <CardView card={{ cardId: card.cardId } as Card} />
        {players.length === 0 ? (
          <Text>no votes. 0 extra points.</Text>
        ) : (
          <Stack>
            <Text>{players.join(", ")} voted for this card.</Text>
            {addPointsForVotes && (
              <Text>
                {playerSubmitted} gets +{players.length}{" "}
                {players.length === 1 ? "point" : "points"}.
              </Text>
            )}
          </Stack>
        )}
      </Box>
    );
  });

  const storyPlayerName = playerMap.get(logEntry.storyPlayerId)?.name ?? "???";

  const storyVotes =
    logEntry.cardsSubmitted.get(logEntry.storyCard)?.playersVoted ?? [];
  const otherStoryVotes = storyVotes.map(
    (votePlayerId) => playerMap.get(votePlayerId)?.name ?? "???"
  );

  return (
    <Stack my="15px">
      <Text textAlign="center" fontSize="xl">
        Round #{roundNo}
      </Text>
      <HStack>
        <Text as="b">
          {playerMap.get(logEntry.storyPlayerId)?.name + " " ?? "???"}
        </Text>
        <Text>submitted story</Text>
        <Text as="em" fontSize="xl">
          {logEntry.story}
        </Text>
        <Text>with card:</Text>
      </HStack>
      <CardView card={{ cardId: logEntry.storyCard } as Card} />
      <Text>
        {logEntry.allVotesForStory && `Everyone guessed the story card.`}
        {logEntry.noVotesForStory && `Nobody guessed the story card.`}
      </Text>
      {otherStoryVotes.length > 0 && (
        <Text>{otherStoryVotes?.join(", ") ?? ""} guessed the story card.</Text>
      )}
      <Text>
        {!logEntry.allVotesForStory &&
          !logEntry.noVotesForStory &&
          `${storyPlayerName}, ${
            otherStoryVotes.join(", ") ?? ""
          } each get +3 points`}
      </Text>
      <Text>
        {(logEntry.allVotesForStory || logEntry.noVotesForStory) &&
          `${storyPlayerName} gets 0 points, everyone else gets 2 points.`}
      </Text>
      {cardVotes}
    </Stack>
  );
};

const GameLog: React.FC = () => {
  const gameLog = useRoomStore((state) => state.gameLog);
  const players = useRoomStore((state) => state.players);
  const playerMap = players.reduce((map, player) => {
    map.set(player.id, player);
    return map;
  }, new Map<string, Player>());

  const rounds = gameLog.length;
  const logItems = gameLog.map((logEntry, idx) => (
    <div key={idx}>
      <GameLogItem
        playerMap={playerMap}
        logEntry={logEntry}
        roundNo={rounds - idx}
      />
    </div>
  ));
  if (logItems.length === 0) {
    return null;
  }
  return (
    <Stack
      backgroundColor="#B0CC69"
      color="F2F3ED"
      px={5}
      py={3}
      mt={10}
      borderRadius={10}
    >
      <Text>History: </Text>
      {logItems}
    </Stack>
  );
};

export default GameLog;
