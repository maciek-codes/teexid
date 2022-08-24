import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, Button, HStack, List, ListItem, Text } from "@chakra-ui/react";

import { usePlayer } from "./contexts/PlayerContext";
import Player from "./models/Player";
import { useSocket } from "./contexts/WebsocketContext";
import { ErrorPayload, OnPlayersUpdatedPayload } from "./types";

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
    <ListItem>
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
    (type: string, data: unknown) => {
      if (type === "on_players_updated") {
        const payload = data as OnPlayersUpdatedPayload;
        setPlayersList(payload.players);
      } else if (type === "error") {
        const payload = data as ErrorPayload;
        if (payload.type === "room_not_found") {
          setHasError(true);
        }
      } else if (type === "on_room_state_updated") {
        const payload = data as any;
        setGameStarted(payload.state === "playing")
      }
    },
    [setPlayersList]
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
    <>
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
    </>
  );
};
