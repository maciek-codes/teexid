import React from "react";

import { Box, Stack, Text } from "@chakra-ui/react";
import { useGameStore } from "./stores/GameStore";
import { CardView } from "./components/CardView";

export const TurnResults = (): JSX.Element => {
  const story = useGameStore((s) => s.room.story);
  const storyCard = useGameStore((s) => s.room.storyCard);
  const turnResult = useGameStore((s) => s.room.turnResult);
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
          fontFamily="cursive"
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
    </Stack>
  );
};
