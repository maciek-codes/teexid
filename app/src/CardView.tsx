import { Box, Image } from "@chakra-ui/react";
import Card from "./models/Card";

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
    <Box boxSize="md" onClick={handleClick} width="fit-content">
      <Image
        src={imageUrl}
        alt="Card"
        border={selected ?? false ? "4px" : "0px"}
        width="150px"
        margin="0"
      />
    </Box>
  );
};

export default CardView;
