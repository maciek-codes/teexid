import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, Button, HStack, List, ListItem, Text } from "@chakra-ui/react";

import { usePlayer } from "./contexts/PlayerContext";
import Player from "./models/Player";
import { useSocket } from "./contexts/WebsocketContext";
import { ResponseMsg } from "./types";

type OnPlayersUpdatedPayload = {
  players: Player[];
};

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
  const { id } = usePlayer();
  const { ws, sendCommand } = useSocket();

  const onMessage = useCallback(
    (evt: MessageEvent<string>) => {
      const data = JSON.parse(evt.data) as ResponseMsg<unknown>;
      if (data.type === "onplayersupdated") {
        const payload = data.payload as OnPlayersUpdatedPayload;
        setPlayersList(payload.players);
      }
    },
    [setPlayersList]
  );

  const onReadyClick = useCallback(() => {
    sendCommand("player/ready", null);
  }, [sendCommand]);

  ws.addEventListener("message", onMessage);

  useEffect(() => {
    sendCommand("get_players", null);

    return () => {
      ws.removeEventListener("message", onMessage);
    };
  }, [ws, sendCommand, onMessage]);

  const allReady = useMemo(() => {
    return playersList.reduce((acc: number, curr: Player) => {
      return acc + (curr.ready ? 1 : 0)
    }, 0);
  }, [playersList]);

  const startGame = useCallback(() => {
    sendCommand("game/start", null);
  }, [sendCommand]);

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
      {allReady ? <Button onClick={() => startGame()}>Start</Button> : null}
    </>
  );
};
