import React, { useMemo } from "react";
import {
  Avatar,
  Box,
  Button,
  HStack,
  List,
  ListItem,
  Text,
} from "@chakra-ui/react";

import { usePlayerStore } from "./stores/PlayerStore";
import Player from "./models/Player";
import { useRoomStore } from "./stores/RoomStore";
import { useReady } from "./queries/useReady";
import { useStart } from "./queries/useStart";

const MIN_PLAYERS = 2;

type PlayerItemProps = {
  player: Player;
  currentPlayerId: string;
  onReadyClick: () => void;
  isTellingStory: boolean;
  hasSubmittedCard: boolean;
  hasVoted: boolean;
};

const PlayerItem: React.FC<PlayerItemProps> = ({
  player,
  currentPlayerId,
  onReadyClick,
  isTellingStory,
  hasSubmittedCard,
  hasVoted,
}: PlayerItemProps) => {
  const isSelf = player.id === currentPlayerId;
  return (
    <ListItem mt="1">
      <Box
        display="flex"
        justifyContent="space-between"
        justifyItems="center"
        placeItems="center"
        flexDir="row"
      >
        <Box
          display="flex"
          flexDir="row"
          alignItems="center"
          justifyItems="center"
        >
          <Avatar
            name={player.name}
            backgroundColor="#B0CC69"
            color="#F2F3ED"
          />
          <HStack>
            <Text
              ml={4}
              color={isSelf ? "green.100 " : "#F2F3ED"}
              justifySelf="left"
            >
              {player.name}
            </Text>
            {isTellingStory ? (
              <Box display="inline" ml="2px">
                {" "}
                ✍
              </Box>
            ) : null}
            {hasSubmittedCard ? <i> &#127183;</i> : null}
            {hasVoted ? <i> &#128499;</i> : null}
          </HStack>
          {!player.ready && (
            <Text ml={2} color={"#F2F3ED"}>
              {" "}
              (not ready)
            </Text>
          )}
        </Box>
        <Text color={isSelf ? "green.100" : "#F2F3ED"}>{player.points} pt</Text>
        {isSelf && !player.ready ? (
          <Button onClick={onReadyClick}>I'm ready</Button>
        ) : null}
      </Box>
    </ListItem>
  );
};
export const PlayerList: React.FC = () => {
  const { id, isOwner } = usePlayerStore();
  const players = useRoomStore((state) => state.players);
  const roomState = useRoomStore((state) => state.roomState);
  const storyPlayerId = useRoomStore((state) => state.storyPlayerId);
  const turnState = useRoomStore((state) => state.turnState);
  const submittedBy = useRoomStore((state) => state.submittedBy);
  const gameStarted = roomState !== "waiting";
  const sendReadyQuery = useReady();
  const startQuery = useStart();

  const onReadyClick = () => {
    sendReadyQuery.mutate();
  };

  const canStart = useMemo(() => {
    return (
      !gameStarted &&
      isOwner &&
      players.reduce((acc: number, curr: Player) => {
        return acc + (curr.ready ? 1 : 0);
      }, 0) >= MIN_PLAYERS
    );
  }, [gameStarted, isOwner, players]);

  const startGame = () => {
    if (isOwner) {
      startQuery.mutate();
    }
  };

  const isVoting = turnState === "voting";
  const isSelectingCards = turnState === "selecting_cards";

  // Create a list of players
  return (
    <Box
      rounded="lg"
      backgroundColor="#537CB9"
      color="F2F3ED"
      m="5"
      p="5"
      minWidth={["sm", "780px"]}
    >
      <List>
        {players.map((player: Player, idx: number) => {
          const hasSubmitted =
            submittedBy.filter((sb) => sb === player.id).length === 1;
          return (
            <Box mt="10px" key={idx}>
              <PlayerItem
                player={player}
                currentPlayerId={id ?? ""}
                onReadyClick={onReadyClick}
                isTellingStory={player.id === storyPlayerId}
                hasSubmittedCard={hasSubmitted && isSelectingCards}
                hasVoted={hasSubmitted && isVoting}
              />
            </Box>
          );
        })}
      </List>
      {canStart ? (
        <Button mt={5} onClick={() => startGame()}>
          Start
        </Button>
      ) : null}
    </Box>
  );
};
