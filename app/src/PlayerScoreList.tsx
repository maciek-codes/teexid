import React from "react";
import { Box, List, Text } from "@chakra-ui/react";
import { PlayerState } from "@teexid/shared";

interface PlayerScoresProps {
  playersList: Array<PlayerState>;
}

const PlayerScores = ({ playersList }: PlayerScoresProps) => {
  const scoreItems = playersList
    .filter((p: PlayerState) => p.points > 0)
    .sort((a, b) => {
      return a.points === b.points ? 0 : a.points > b.points ? 1 : -1;
    })
    .map((player, idx) => {
      return (
        <Text key={idx} fontSize="m">
          {player.name}: {player.points}
        </Text>
      );
    });
  if (scoreItems.length === 0) {
    return null;
  }
  return (
    <Box mt="10">
      <Text fontSize="xl" className="heading">
        Points:
      </Text>
      <List>{scoreItems}</List>
    </Box>
  );
};

export default PlayerScores;
