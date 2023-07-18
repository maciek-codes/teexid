import React from "react";

import { Stack, Text } from "@chakra-ui/react";

import { useRoomStore } from "../stores/RoomStore";
import Player from "../models/Player";
import { GameLogEntry } from "../types";
import { GameLogItem } from "./GameLogItem";

export type GameLogItemProps = {
  logEntry: GameLogEntry;
  playerMap: Map<string, Player>;
  roundNo: number;
};

const GameLog = (): JSX.Element => {
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
    return <></>;
  }
  return (
    <Stack
      backgroundColor="#B0CC69"
      color="F2F3ED"
      px={5}
      py={3}
      mt={10}
      rounded="lg"
    >
      <Text>History: </Text>
      {logItems}
    </Stack>
  );
};

export default GameLog;
