import React, { useCallback, useMemo } from "react";
import { Avatar, Box, Button, HStack, List, ListItem, Text } from "@chakra-ui/react";

import { usePlayer } from "./contexts/PlayerContext";
import Player from "./models/Player";
import { useSocket } from "./contexts/WebsocketContext";
import PlayerScores from "./PlayerScoreList";
import { useRoom } from "./contexts/RoomContext";

const MIN_PLAYERS = 2;

type PlayerItemProps = {
  player: Player;
  currentPlayerId: string;
  onReadyClick: () => void;
};

const PlayerItem: React.FC<PlayerItemProps> = ({
  player,
  currentPlayerId,
  onReadyClick,
}: PlayerItemProps) => {
  const isSelf = player.id === currentPlayerId;
  return (
    <ListItem mt="1">
      <HStack>
        <Avatar name={player.name} />
        <Text color={isSelf ? "green.400 " : "black"}>{player.name}</Text>
        {player.ready ? <Text> (ready)</Text> : null}
        {isSelf && !player.ready ? (
          <Button onClick={onReadyClick}>I'm ready</Button>
        ) : null}
      </HStack>
    </ListItem>
  );
};
export const PlayerList: React.FC = () => {
  const { id, isOwner } = usePlayer();
  const { roomId, players, roomState } = useRoom();
  const { sendCommand } = useSocket();
  const gameStarted = roomState !== 'waiting';

  const onReadyClick = useCallback(() => {
    sendCommand({type: "player/ready", data: {roomId}});
  }, [roomId, sendCommand]);

  const canStart = useMemo(() => {
    return !gameStarted && isOwner && players.reduce((acc: number, curr: Player) => {
      return acc + (curr.ready ? 1 : 0)
    }, 0) >= MIN_PLAYERS;
  }, [gameStarted, isOwner, players]);

  const startGame = useCallback(() => {
    if (isOwner) {
      sendCommand({type: "game/start", data: {roomId}});
    }
  }, [roomId, isOwner, sendCommand]);

  // Create a list of players
  return (
    <Box backgroundColor="red.100" m="5" p="5">
      <List>
        {players.map((player: Player, idx: number) => {
          return (
            <PlayerItem
              key={idx} player={player} currentPlayerId={id ?? ""} 
              onReadyClick={onReadyClick}
            />
          );
        })}
      </List>
      { canStart ?
      <Button onClick={() => startGame()}>Start</Button> : null}

      <PlayerScores playersList={players} />
    </Box>
  );
};
