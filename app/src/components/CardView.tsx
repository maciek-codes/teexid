import { Image } from "@chakra-ui/react";

import { Card } from "@teexid/shared";

interface CardViewProps {
  card: Card;
  size?: "sm" | "lg";
  selected?: boolean;
  onClick?: (card: Card) => void;
}

export const CardView = ({
  card,
  size = "lg",
  selected,
  onClick,
}: CardViewProps) => {
  const imageUrl = "/cards/" + (card?.cardId ?? "") + ".jpg";

  const handleClick = () => {
    if (onClick) {
      onClick(card);
    }
  };

  return (
    <Image
      mx={2}
      onClick={handleClick}
      src={imageUrl}
      alt="Card"
      fit="cover"
      cursor="pointer"
      border={selected ?? false ? "2px" : "0px"}
      transition="all .3s ease"
      filter={selected ?? false ? "brightness(110%)" : "brightness(90%)"}
      _hover={{ opacity: selected ?? false ? 1 : 0.5 }}
      transform={selected ?? false ? "scale(1.1)" : "auto"}
      width={size === "lg" ? [150, 150, 180] : [75, 75, 90]}
      height={size === "lg" ? "240px" : "120px"}
      minHeight={size === "lg" ? 240 : 120}
      margin="0"
    />
  );
};
