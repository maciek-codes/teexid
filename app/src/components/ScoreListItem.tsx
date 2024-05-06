import React from "react";

import { Box, Flex, Stack, Text } from "@chakra-ui/react";

import { PlayerState } from "@teexid/shared";
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
}: {
  player: PlayerState;
  score: number;
  scoreBefore: number;
  votesFrom: string[];
  wasStoryTeller: boolean;
  submittedCardId: number | null;
}): JSX.Element => {
  const diff = score - scoreBefore;
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
        {diff > 0 && (
          <Flex gap="5px">
            <Text>Points scored in this round:</Text>
            <Text fontWeight={800}>{diff}</Text>
          </Flex>
        )}

        {playersVotedFrom.length > 0 && (
          <Flex gap="5px">
            <Text>Voted for this card:</Text>
            <>
              {playersVotedFrom.map((name, idx) => (
                <Text key={idx} fontWeight={800}>
                  {name}
                </Text>
              ))}
            </>
          </Flex>
        )}
        <Flex gap="5px">
          <Text>Total score:</Text>
          <Text fontWeight={800}>{score}</Text>
        </Flex>
      </Stack>
    </Box>
  );
};
