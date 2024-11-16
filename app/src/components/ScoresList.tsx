import React from "react";

import { Box, Text } from "@chakra-ui/react";
import { Scores } from "@teexid/shared";

import { useGameStore } from "../stores/GameStore";
import { ScoreListItem } from "./ScoreListItem";
import { CardView } from "./CardView";

export const ScoresList = ({
  scores,
  round,
}: {
  scores: Scores;
  round: number;
}): JSX.Element => {
  const players = useGameStore((s) => s.room.players);

  const scoreValues = Object.values(scores);
  const story = scoreValues.length > 0 ? scoreValues[0].story : "";
  const storyPlayerId =
    scoreValues.length > 0 ? scoreValues[0].storyPlayerId : "";
  const storyCardId =
    scoreValues.find((s) => s.wasStoryTelling && s.submittedCard)
      ?.submittedCard ?? -1;

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
        turnResult={roundScores.turnResult}
      />
    );
  });

  return (
    <Box bgColor="#ebd9ff" borderRadius="12px" p={6}>
      <Text textAlign="center" fontSize="larger">
        Round #{round} scores:
      </Text>
      <Text>
        The story "{story}" was submitted by{" "}
        {players.find((p) => p.id === storyPlayerId)?.name ?? ""} with the
        following card:
      </Text>
      {storyCardId >= 0 && (
        <CardView card={{ cardId: storyCardId }} size="sm" />
      )}
      {individualScores}
    </Box>
  );
};
