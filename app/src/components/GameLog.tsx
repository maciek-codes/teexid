import { Box, Stack, Text } from "@chakra-ui/react";
import React from "react";
import CardView from "../CardView";
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
    return (
      <Box mt="1em" backgroundColor="orange.300">
        <Text>
          <Text as="b">
            {playerMap.get(card.playerSubmitted)?.name ?? "???"}
          </Text>{" "}
          submitted:
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

  return (
    <Stack backgroundColor="orange.200" my="15px">
      <Text textAlign="center" fontSize="xl">
        Round #{roundNo}
      </Text>
      <Text>
        <Text as="b">
          {playerMap.get(logEntry.storyPlayerId)?.name ?? "???"}
        </Text>{" "}
        submitted story {logEntry.story}
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
    <Stack px={5} py={3} mt={10}>
      <Text>History: </Text>
      {logItems}
    </Stack>
  );
};

export default GameLog;
