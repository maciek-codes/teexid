import React from "react";

import { Box, Stack, Text } from "@chakra-ui/react";
import { useGameStore } from "./stores/GameStore";
import CardView from "./components/CardView";
import { Scores } from "@teexid/shared";

const ScoreListItem = ({
  playerName,
  score,
  scoreBefore,
  votesFrom,
}: {
  playerName: string;
  score: number;
  scoreBefore: number;
  votesFrom: string[];
}): JSX.Element => {
  const diff = score - scoreBefore;
  const players = useGameStore((s) => s.room.players);
  const playersVotedFrom = votesFrom
    .map((playerId) => {
      return players.find((p) => p.id === playerId)?.name;
    })
    .filter((name) => name !== undefined && name !== null && name !== "");

  return (
    <Box>
      <Text>{playerName}:</Text>
      <Text>
        New score: {score} points: {diff > 0 ? `(+ ${diff} pts)` : ""}
      </Text>
      {playersVotedFrom.length > 0 && (
        <Text>Voted by: {playersVotedFrom.join(", ")}</Text>
      )}
    </Box>
  );
};

const ScoresList = ({ scores }: { scores: Scores }): JSX.Element => {
  const players = useGameStore((s) => s.room.players);

  const individualScores = Object.keys(scores).map((playerId, idx) => {
    if (playerId === "") return null;
    const roundScores = scores[playerId];
    const name = players.find((p) => p.id === playerId)?.name;
    return (
      <ScoreListItem
        key={idx}
        playerName={name ?? ""}
        score={roundScores.score}
        scoreBefore={roundScores.scoreBefore}
        votesFrom={roundScores.votesFrom}
      />
    );
  });

  return <>{individualScores}</>;
};

export const TurnResults = (): JSX.Element => {
  const story = useGameStore((s) => s.room.story);
  const storyPlayerName = useGameStore((s) => s.room.storyPlayerName);
  const storyCard = useGameStore((s) => s.room.storyCard);
  const scores = useGameStore((s) => s.room.scores);

  return (
    <Stack>
      <Text>Turn results</Text>;
      <Text>
        Story: {story} by {storyPlayerName}
      </Text>
      <Text>Actual story card:</Text>
      <CardView card={storyCard} />
      <Text>This round scores:</Text>
      <>
        {scores !== null &&
          Object.values(scores).map((turnScores, idx) => (
            <ScoresList key={`turns-${idx}`} scores={turnScores} />
          ))}
      </>
    </Stack>
  );
};
