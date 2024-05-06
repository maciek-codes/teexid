import React from "react";

import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import { useGameStore } from "./stores/GameStore";
import CardView from "./components/CardView";
import { PlayerAvatar } from "./components/PlayerAvatar";
import { PlayerState, Scores } from "@teexid/shared";

const ScoreListItem = ({
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

const ScoresList = ({
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
    <Box>
      <Text textAlign="center" fontSize="larger" fontFamily="cursive">
        Round #{round} scores:
      </Text>
      {individualScores}
    </Box>
  );
};

export const TurnResults = (): JSX.Element => {
  const story = useGameStore((s) => s.room.story);
  const storyCard = useGameStore((s) => s.room.storyCard);
  const turnResult = useGameStore((s) => s.room.turnResult);
  const scores = Array.from(useGameStore((s) => s.room.scores) ?? []);
  return (
    <Stack>
      <Box>
        <Text fontSize="lg" fontWeight={400} textAlign="center">
          Story:
        </Text>
        <Text
          fontSize="xl"
          fontWeight={600}
          textAlign="center"
          fontStyle="cursive"
        >
          {story}
        </Text>
        {turnResult === "nobody_guessed" && (
          <>
            <Text fontSize="md" fontWeight={600}>
              Nobody guessed the story!
            </Text>
            <Text>
              Every player gets 2 points. Story teller gets 0. Each player who
              got votes gets 1 point per vote.
            </Text>
          </>
        )}
        {turnResult === "everyone_guessed" && (
          <>
            <Text fontSize="md" fontWeight={600} textAlign="center">
              Nobody guessed the story!
            </Text>
            <Text>Every player gets 2 points. Story teller gets 0.</Text>
            <Text> Each player who got votes gets 1 point per vote.</Text>
          </>
        )}
        {turnResult === "story_guessed" && (
          <>
            <Text fontSize="md" fontWeight={600}>
              The correct story card guessed.
            </Text>
            <Text fontSize="md" fontWeight={400}>
              The players who guessed and the story teller get +3 points.
            </Text>
            <Text fontSize="md" fontWeight={400}>
              Each player who got votes (except story teller) gets 1 point per
              vote.
            </Text>
          </>
        )}
      </Box>
      {storyCard && (
        <>
          <Text variant="">The story card for "{story}":</Text>
          <CardView size="sm" card={storyCard} />
        </>
      )}
      <>
        {scores !== null &&
          scores
            .reverse()
            .map((turnScores, idx) => (
              <ScoresList
                key={`turns-${idx}`}
                round={scores.length - idx}
                scores={turnScores}
              />
            ))}
      </>
    </Stack>
  );
};
