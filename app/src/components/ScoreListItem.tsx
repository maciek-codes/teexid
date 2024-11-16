import React from "react";

import { Box, Flex, Stack, Text } from "@chakra-ui/react";

import { PlayerState, TurnResult } from "@teexid/shared";
import { useGameStore } from "../stores/GameStore";
import { PlayerAvatar } from "./PlayerAvatar";
import { CardView } from "./CardView";

export const ScoreListItem = ({
  player,
  score,
  scoreBefore,
  votesFrom,
  wasStoryTeller,
  submittedCardId,
  turnResult,
}: {
  player: PlayerState;
  score: number;
  scoreBefore: number;
  votesFrom: string[];
  wasStoryTeller: boolean;
  submittedCardId: number | null;
  turnResult: TurnResult;
}): JSX.Element => {
  const players = useGameStore((s) => s.room.players);
  const playersVotedFrom = votesFrom
    .map((playerId) => {
      return players.find((p) => p.id === playerId)?.name;
    })
    .filter((name) => name !== undefined && name !== null && name !== "");

  return (
    <Box mt={10} display="grid" gridTemplateColumns={"1fr auto 4fr"} gap="30px">
      <Stack
        alignContent="center"
        justifyContent="center"
        justifyItems="center"
      >
        <PlayerAvatar player={player} size="md" />
        <Text>{player.name}</Text>
        {wasStoryTeller && <Text size="smaller">✍️</Text>}
      </Stack>
      {submittedCardId !== null && (
        <CardView card={{ cardId: submittedCardId }} size="sm" />
      )}
      <Stack>
        {score > 0 && (
          <Flex gap="5px">
            <Text>Points scored in this round:</Text>
            <Text fontWeight={800}>{score}</Text>
          </Flex>
        )}

        {}

        {playersVotedFrom.length > 0 && (
          <Box display="inline-block" overflowWrap="break-word">
            {playersVotedFrom.map((name) => (
              <Text key={name} fontWeight={800} mx="1px">
                {name}
              </Text>
            ))}
            <Text> voted for this card:</Text>
          </Box>
        )}
        <Flex gap="5px">
          <Text>Total score:</Text>
          <Text fontWeight={800}>{scoreBefore + score}</Text>
        </Flex>
      </Stack>
    </Box>
  );
};
