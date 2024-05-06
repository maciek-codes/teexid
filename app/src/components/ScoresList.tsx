import React from "react";

import { Box, Text } from "@chakra-ui/react";
import { Scores } from "@teexid/shared";

import { useGameStore } from "../stores/GameStore";
import { ScoreListItem } from "./ScoreListItem";

export const ScoresList = ({
  scores,
  round,
}: {
  scores: Scores;
  round: number;
}): JSX.Element => {
  const players = useGameStore((s) => s.room.players);

  const individualScores = Object.keys(scores).map((playerId, idx) => {
    if (playerId === "") {
      return null;
    }
    const player = players.find((p) => p.id === playerId);
    if (player === undefined) {
      return null;
    }
    const roundScores = scores[playerId];
    return (
      <ScoreListItem
        key={idx}
        player={player}
        score={roundScores.score}
        scoreBefore={roundScores.scoreBefore}
        votesFrom={roundScores.votesFrom}
        wasStoryTeller={roundScores.wasStoryTelling}
        submittedCardId={roundScores.submittedCard}
      />
    );
  });

  return (
    <Box bgColor="#ebd9ff" borderRadius="12px" p={6}>
      <Text textAlign="center" fontSize="larger" fontFamily="cursive">
        Round #{round} scores:
      </Text>
      {individualScores}
    </Box>
  );
};
