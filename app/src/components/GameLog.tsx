import { Stack, Text } from "@chakra-ui/react";
import React from "react";
import CardView from "../CardView";
import { useRoom } from "../contexts/RoomContext";
import Card from "../models/Card";
import Player from "../models/Player";
import { GameLogEntry } from "../types";

type GameLogItemProps = {
  logEntry: GameLogEntry;
  playerMap: Map<string, Player>;
};

const GameLogItem: React.FC<GameLogItemProps> = ({
  logEntry,
  playerMap,
}: GameLogItemProps) => {
  const cardVotes = Array.from(logEntry.cardsSubmitted.values()).map((card) => {
    // Check who voted for this card
    const players = card.playersVoted
      .map((playerId) => playerMap.get(playerId)?.name ?? "???")
      .join(", ");
    return (
      <>
        <Text>
          {" "}
          {playerMap.get(card.playerSubmitted)?.name ?? "???"} submitted:
        </Text>
        <CardView card={{ cardId: card.cardId } as Card} />
        {players.length === 0 ? (
          <Text>no votes.</Text>
        ) : (
          <Text>{players} voted.</Text>
        )}
      </>
    );
  });

  return (
    <>
      <Text>
        {playerMap.get(logEntry.storyPlayerId)?.name ?? "???"} submitted story{" "}
        {logEntry.story}
      </Text>
      {cardVotes}
    </>
  );
};

const GameLog: React.FC = () => {
  const { gameLog, players } = useRoom();
  const playerMap = players.reduce((map, player) => {
    map.set(player.id, player);
    return map;
  }, new Map<string, Player>());
  const logItems = gameLog.map((logEntry, idx) => (
    <GameLogItem key={idx} playerMap={playerMap} logEntry={logEntry} />
  ));
  return (
    <Stack background="#ed2f2f" pt={2} my={10}>
      <Text>History: </Text>
      {logItems}
    </Stack>
  );
};

export default GameLog;
