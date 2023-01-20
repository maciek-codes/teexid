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
    <Box
      boxSize="md"
      onClick={handleClick}
      width="fit-content"
      height="fit-content"
    >
      <Image
        src={imageUrl}
        alt="Card"
        fit="cover"
        cursor="pointer"
        border={selected ?? false ? "2px" : "0px"}
        transition="all .25s ease"
        filter={selected ?? false ? "brightness(110%)" : "brightness(90%)"}
        _hover={{ transform: "scale(1.1)" }}
        transform={selected ?? false ? "scale(1.1)" : "auto"}
        width="150px"
        height="180px"
        margin="0"
      />
    </Box>
  );
};

export default CardView;
