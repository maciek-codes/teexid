import React from "react";

import { Stack, Text } from "@chakra-ui/react";

import { PlayerState } from "@teexid/shared";
import { GameLogEntry } from "../types";
import { GameLogItem } from "./GameLogItem";
import { useGameStore } from "../stores/GameStore";

export type GameLogItemProps = {
  logEntry: GameLogEntry;
  playerMap: Map<string, PlayerState>;
  roundNo: number;
};

const GameLog = (): JSX.Element => {
  return <></>;
};

export default GameLog;
