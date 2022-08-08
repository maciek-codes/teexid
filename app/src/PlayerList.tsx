import React from 'react';
import { Avatar, List, ListItem, Text } from "@chakra-ui/react";

import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import Player from "./models/Player";

export const PlayerList: React.FC = () => {

  const room = useRoom();
  const {id} = usePlayer();
  const playersList = room.players;

  // Create a list of players
  const players = playersList.map((player: Player, idx: number) => {

    const isSelf = player.id === id;
    return (
      <ListItem key={idx}>
        <Text>Ho!</Text>
        <Avatar name={player.name} />
        <Text color={isSelf ? 'black' : 'green.200'}>{player.name}</Text>
      </ListItem>
    );
  });

  return (
    <List>
      {players}
    </List>
  );
}
