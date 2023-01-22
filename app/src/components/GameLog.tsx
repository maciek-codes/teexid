import { Box, Stack, Text } from "@chakra-ui/react";
import React from "react";
import CardView from "./CardView";
import { useRoom } from "../contexts/RoomContext";
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
  const cardVotes = Array.from(logEntry.cardsSubmitted.values()).map((card) => {
    // Check who voted for this card
    const players = card.playersVoted
      .map((playerId) => playerMap.get(playerId)?.name ?? "???")
      .join(", ");

    // Is Story player?
    const storyPlayersCard = logEntry.storyPlayerId == card.playerSubmitted;

    return (
      <Box mt="1em">
        <Text>
          <Text as="b">
            {playerMap.get(card.playerSubmitted)?.name ?? "???"}
          </Text>{" "}
          submitted card:
        </Text>
        <CardView card={{ cardId: card.cardId } as Card} />
        {players.length === 0 ? (
          <Text>no votes.</Text>
        ) : (
          <Text>{players} voted.</Text>
        )}
      </Box>
    );
  });

  const storyPlayerName = playerMap.get(logEntry.storyPlayerId)?.name ?? "???";

  return (
    <Stack my="15px">
      <Text textAlign="center" fontSize="xl">
        Round #{roundNo}
      </Text>
      <Text>
        <Text as="b">
          {playerMap.get(logEntry.storyPlayerId)?.name ?? "???"}
        </Text>{" "}
        submitted story:{" "}
        <Text as="em" fontSize="xl">
          {logEntry.story}
        </Text>
        <Text>
          {logEntry.allVotesForStory &&
            `Everyone voted for ${storyPlayerName}.`}
          {logEntry.noVotesForStory && "Nobody voted for {storyPlayerName}. "}
        </Text>
        <Text>
          {(logEntry.allVotesForStory || logEntry.noVotesForStory) &&
            `No points for ${storyPlayerName}, +2 points everyone else.`}
        </Text>
      </Text>
      {cardVotes}
    </Stack>
  );
};

const GameLog: React.FC = () => {
  const { gameLog, players } = useRoom();
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
    <Stack backgroundColor="#c2b94f" px={5} py={3} mt={10} borderRadius={10}>
      <Text>History: </Text>
      {logItems}
    </Stack>
  );
};

export default GameLog;
