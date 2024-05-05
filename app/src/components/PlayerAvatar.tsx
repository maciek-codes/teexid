import React from "react";

import { Avatar, AvatarProps } from "@chakra-ui/react";

import { PlayerState } from "@teexid/shared";

const toColor = (name: string) => {
  // Generate an RGB color based on the name hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (hash & 0x00ffffff).toString(16).toUpperCase();
};

export const PlayerAvatar = ({
  player,
  size,
}: {
  player: PlayerState;
  size?: AvatarProps["size"];
}): JSX.Element => {
  return (
    <Avatar
      name={player.name}
      backgroundColor={toColor(player.name)}
      color="#F2F3ED"
      size={size}
    />
  );
};
