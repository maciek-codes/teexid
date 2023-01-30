import { Box, Image } from "@chakra-ui/react";
import Card from "../models/Card";

interface CardViewProps {
  card: Card;
  selected?: boolean;
  onClick?: (card: Card) => void;
}

const CardView = ({ card, selected, onClick }: CardViewProps) => {
  const imageUrl = "/cards/" + card.cardId + ".jpg";

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
      width={[150, 150, 180]}
      height="240px"
      minHeight={240}
      margin="0"
    />
  );
};

export default CardView;
