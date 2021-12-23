import { useState } from "react";
import CardView from "./CardView";
import { Card } from "./models/RoomState";

interface CardSelectorProps {
    cards: Array<Card>
}

const CardSelector = ({cards}: CardSelectorProps) => {

    const [selectedId, setSelectedId] = useState(-1);

    var cardViews = cards.map((card, idx) => {
        return <CardView card={card} 
        onClick={(selectedCard: Card) => {
            if (selectedId === selectedCard.cardId) {
                setSelectedId(-1);
                return;
            }
            setSelectedId(selectedCard.cardId)
        }}
        key={idx}
        selected={card.cardId === selectedId} />
    })
    return (
        <div className="grid grid-cols-4">
            {cardViews}
        </div>
    )
}

export default CardSelector;