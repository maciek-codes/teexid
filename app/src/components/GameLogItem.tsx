import React from "react";

import { Box, HStack, Stack, Text } from "@chakra-ui/react";

import CardView from "./CardView";
import Card from "../models/Card";
import { GameLogItemProps } from "./GameLog";
import { GameLogEntry, GameLogEntryCard } from "../types";

const CardVote = ({
  card,
  cardIdx,
  logEntry,
  playerMap,
}: {
  card: GameLogEntryCard;
  cardIdx: number;
  logEntry: GameLogEntry;
  playerMap: Map<string, { name: string }>;
}): JSX.Element => {
  if (card.playerSubmitted === logEntry.storyPlayerId) {
    return <></>;
  }

  // Check who voted for this card
  const playerSubmitted = playerMap.get(card.playerSubmitted)?.name ?? "???";

  const playersWhoVotedForThisCard = card.playersVoted.map(
    (playerId) => playerMap.get(playerId)?.name ?? "???"
  );
  const addPointsForVotes = !logEntry.allVotesForStory;

  return (
    <Box pt={10} key={cardIdx}>
      <HStack>
        <Text as="b">{playerSubmitted}</Text>
        <Text ml={1}>submitted card:</Text>
      </HStack>
      <CardView card={{ cardId: card.cardId } as Card} />
      {playersWhoVotedForThisCard.length === 0 ? (
        <Text>no votes. 0 extra points.</Text>
      ) : (
        <Stack>
          <Text>
            {playersWhoVotedForThisCard.join(", ")} voted for this card.
          </Text>
          {addPointsForVotes && (
            <Text>
              {playerSubmitted} gets + {playersWhoVotedForThisCard.length}{" "}
              {playersWhoVotedForThisCard.length === 1 ? "point" : "points"}.
            </Text>
          )}
        </Stack>
      )}
    </Box>
  );
};

export const GameLogItem: React.FC<GameLogItemProps> = ({
  logEntry,
  playerMap,
  roundNo,
}: GameLogItemProps) => {
  // Cards submitted by players
  const cards = Array.from(logEntry.cardsSubmitted.values());

  // Votes each card
  const cardVotes = cards.map((card, cardIdx) => {
    return (
      <CardVote
        card={card}
        cardIdx={cardIdx}
        logEntry={logEntry}
        playerMap={playerMap}
      />
    );
  });

  const storyPlayerName = playerMap.get(logEntry.storyPlayerId)?.name ?? "???";

  const playersWhoVotedForTheStory =
    logEntry.cardsSubmitted.get(logEntry.storyCard)?.playersVoted ?? [];
  //const otherStoryVotes = storyVotes.map(
  //  (votePlayerId) => playerMap.get(votePlayerId)?.name ?? "???"
  //);

  const rightCardScore =
    !logEntry.allVotesForStory && !logEntry.noVotesForStory ? (
      <Stack>
        <Text>
          {storyPlayerName} gets +3 points because somoene guess the story right
        </Text>
        <Text>
          {playersWhoVotedForTheStory.join(", ") ?? ""} each get +3 points for
          guessing the story
        </Text>
      </Stack>
    ) : null;

  return (
    <Stack my="15px">
      <Text textAlign="center" fontSize="xl">
        Round #{roundNo}
      </Text>
      <HStack>
        <Text as="b">
          {playerMap.get(logEntry.storyPlayerId)?.name + " " ?? "???"}
        </Text>
        <Text>submitted story</Text>
        <Text as="em" fontSize="xl">
          {logEntry.story}
        </Text>
        <Text>with card:</Text>
      </HStack>
      <CardView card={{ cardId: logEntry.storyCard } as Card} />
      <Text>
        {logEntry.allVotesForStory && `Everyone guessed the story card.`}
        {logEntry.noVotesForStory && `Nobody guessed the story card.`}
      </Text>
      {playersWhoVotedForTheStory.length > 0 && (
        <Text>
          {playersWhoVotedForTheStory?.join(", ") ?? ""} guessed the story card.
        </Text>
      )}
      {rightCardScore}
      <Text>
        {(logEntry.allVotesForStory || logEntry.noVotesForStory) &&
          `${storyPlayerName} gets 0 points, everyone else gets 2 points.`}
      </Text>
      {/* {cardVotes} */}
    </Stack>
  );
};
