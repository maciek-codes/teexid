import React, { useMemo } from "react";
import { Box, Button, HStack, List, ListItem, Text } from "@chakra-ui/react";
import { PlayerState } from "@teexid/shared";
import { useGameStore } from "./stores/GameStore";
import { PlayerAvatar } from "./components/PlayerAvatar";

const MIN_PLAYERS = 2;

type PlayerItemProps = {
  player: PlayerState;
  onReadyClick: () => void;
};

const PlayerItem: React.FC<PlayerItemProps> = ({
  player,
  onReadyClick,
}: PlayerItemProps) => {
  const playerName = useGameStore((s) => s.playerName);
  const isSelf = player.name === playerName;
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
          <PlayerAvatar player={player} size={"md"} />
          <HStack>
            <Text
              ml={4}
              color={isSelf ? "green.100 " : "#F2F3ED"}
              justifySelf="left"
            >
              {player.name}
            </Text>
            {player.status === "story_telling" ? (
              <Box display="inline" ml="2px">
                {" "}
                ✍
              </Box>
            ) : null}
            {player.status === "submitted_card" ? <i> &#127183;</i> : null}
            {player.status === "vote_submitted" ? <i> &#128499;</i> : null}
          </HStack>
          {!player.ready && (
            <Text ml={2} color={"#F2F3ED"}>
              {" "}
              (not ready)
            </Text>
          )}
        </Box>
        {player.points && player.points > 0 && (
          <Text color={isSelf ? "green.100" : "#F2F3ED"}>
            {player.points} pt
          </Text>
        )}
        {isSelf && !player.ready ? (
          <Button onClick={onReadyClick}>I'm ready</Button>
        ) : null}
      </Box>
    </ListItem>
  );
};
export const PlayerList: React.FC = () => {
  const players = useGameStore((s) => s.room.players);
  const gameState = useGameStore((s) => s.room.gameState);
  const gameStarted = gameState !== "waiting";
  const turnState = useGameStore((s) => s.room.turnState);
  const send = useGameStore((s) => s.send);

  const onReadyClick = () => {
    send({ type: "mark_ready" });
  };

  const startGame = () => {
    send({ type: "start_game" });
  };

  const canStart = useMemo(() => {
    return (
      (!gameStarted || turnState === "finished") &&
      players.reduce((acc: number, curr: PlayerState) => {
        return acc + (curr.ready ? 1 : 0);
      }, 0) >= MIN_PLAYERS
    );
  }, [gameStarted, players]);

  // Create a list of players
  return (
    <Box
      rounded="lg"
      maxW="lg"
      backgroundColor="#537CB9"
      color="F2F3ED"
      m="5"
      p="5"
    >
      <List>
        {players.map((player: PlayerState, idx: number) => {
          return (
            <Box mt="10px" key={idx}>
              <PlayerItem player={player} onReadyClick={onReadyClick} />
            </Box>
          );
        })}
      </List>
      {canStart ? (
        <Button mt={5} onClick={() => startGame()}>
          {turnState === "finished" ? "Next turn" : "Start"}
        </Button>
      ) : null}
    </Box>
  );
};
