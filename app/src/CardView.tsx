import { Box, Image } from "@chakra-ui/react";
import Card from "./models/Card";

interface CardViewProps {
    card: Card
    selected?: boolean
    onClick?: (card: Card) => void
}

const CardView = ({card, selected, onClick}: CardViewProps) => {
    const imageUrl = "http://localhost:8080/cards/" + card.cardId;

    const handleClick = () => {
        if (onClick) {
            onClick(card);
        }
    }

    return (
        <Box boxSize="md" onClick={handleClick}>
            <Image src={imageUrl} alt="Card"  border={selected ?? false ? "0px" : "4px"} />
        </Box>
    )
};

export default CardView;