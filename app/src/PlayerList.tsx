import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, Box, Button, HStack, List, ListItem, Text } from "@chakra-ui/react";

import { usePlayer } from "./contexts/PlayerContext";
import Player from "./models/Player";
import { useSocket } from "./contexts/WebsocketContext";
import { ResponseMsg } from "./types";

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
  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [hasError, setHasError] = useState<boolean>(false);
  const { id, isOwner } = usePlayer();
  const { addMsgListener, removeMsgListener, sendCommand } = useSocket();
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  const onMessage = useCallback(
    ({type, payload}: ResponseMsg) => {
      switch (type) {
        case "on_players_updated":
          setPlayersList(payload.players);
          break;
        case "error":
          if (payload.type === "room_not_found") {
            setHasError(true);
          }
          break;
        case "on_room_state_updated":
          if (!gameStarted) {
            setGameStarted(payload.state !== 'waiting')
          }
          break;
        }
    },
    [gameStarted, setPlayersList]
  );

  const onReadyClick = useCallback(() => {
    sendCommand("player/ready", null);
  }, [sendCommand]);

  
  useEffect(() => {
    addMsgListener(onMessage);
    const onMessageRef = onMessage;
    return () => {
      removeMsgListener(onMessageRef);
    };
  }, [addMsgListener, onMessage, removeMsgListener]);

  useEffect(() => {
    if (!hasError) {
      sendCommand("get_players", {});
    }
  }, [hasError, sendCommand]);

  const canStart = useMemo(() => {
    return !gameStarted && isOwner && playersList.reduce((acc: number, curr: Player) => {
      return acc + (curr.ready ? 1 : 0)
    }, 0) >= MIN_PLAYERS;
  }, [gameStarted, isOwner, playersList]);

  const startGame = useCallback(() => {
    if (isOwner)
      sendCommand("game/start", null);
  }, [isOwner, sendCommand]);

  // Create a list of players
  return (
    <Box backgroundColor="red.100" m="5" p="5">
      <List>
        {playersList.map((player: Player, idx: number) => {
          return (
            <PlayerItem
              key={idx}
              player={player}
              currentPlayerId={id ?? ""}
              onReadyClick={onReadyClick}
            />
          );
        })}
      </List>
      { canStart ?
      <Button onClick={() => startGame()}>Start</Button> : null}

      {/* Scores */}
      {playersList.filter((p => p.points > 0)).length > 0 ? 
      <Box mt="10">
       <Text fontSize="xl" className="heading">Points:</Text>
        <List>
          {playersList.sort((a, b) => {
            return a.points === b.points ? 0 : 
              a.points > b.points ? 1 : - 1;
          }).map((player: Player, idx: number) => {
            return (
              <Text key={idx} fontSize="m">{player.name}: {player.points}</Text>
            );
          })}
        </List>
      </Box> : null
      }
    </Box>
  );
};
