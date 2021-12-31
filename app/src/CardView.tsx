import Card from "./models/Card";

interface CardViewProps {
    card: Card
    selected?: boolean
    onClick?: (card: Card) => void
}

const CardView = ({card, selected, onClick}: CardViewProps) => {
    const imageUrl = "http://localhost:8080/cards/" + card.cardId;
    let className = "max-w-sm m-2";
    if (selected) {
        className += " selected border-2 border-green-900"
    }

    const handleClick = () => {
        if (onClick) {
            onClick(card);
        }
    }

    return (
        <div className={className} onClick={handleClick}>
            <img className="object-cover h-96 w-56" src={imageUrl} alt="Card" />
        </div>
    )
};

export default CardView;