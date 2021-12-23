import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ServerAction } from "./App";
import CardSelector from "./CardSelector";
import CardView from "./CardView";
import RoomState from "./models/RoomState";
import PlayerList from "./PlayerList";

type GameRoomProps = {
  roomState: RoomState;
  sendCommand: (action: ServerAction) => void;
};

type CopyButtonProps = {copyText: string};
const CopyButton = ({copyText}: CopyButtonProps) => {
  return (
    <button onClick={() => {
      navigator.clipboard.writeText(copyText)
    }}>
      <FontAwesomeIcon icon={["far", "copy"]} />
    </button>
  )
}

const GameRoom = ({ roomState, sendCommand }: GameRoomProps) => {
  const roomId = roomState.id;

  let gameEl = null;
  let promptEl = null;
  if (roomState.gameStatus === 'playing') {

    if (roomState.turnState?.storyPrompt !== '') {
      promptEl = (
        <div>{roomState.turnState?.storyPrompt}</div>
      )
    }

    if (roomState.turnState?.turnStatus) {
      switch(roomState.turnState?.turnStatus ) {
        case 'writingStory': {
          let cards = roomState.playerCards.map(card =>
            <CardView key={card.cardId} card={card} />
          );
          gameEl = (
            <div>
              <div>Write story and select the card</div>
              <input className="input" placeholder="Story" />
              {cards}
              <button>Submit</button>
            </div>
          );
          break;
        }
        case 'waitingForStory': {
          gameEl = <span>Waitin for the story</span>;
          break;
        }
        case 'submittingCard': {
          gameEl = <span>Submitt</span>;
          break;
        }
        case 'waitingForOthers': {
          gameEl = <span>Waiting</span>;
          break;
        }
        case 'voting': {
          gameEl = <span>Voting</span>;
          break;
        }
        case 'voted': {
          gameEl = <span>Voted, waiting for others</span>;
        }
      }
    }
  } else {
    gameEl = (
      <section>
        <p>Waiting to start</p>
      </section>
    )
  }

  return (
    <div id="room" className="room">
      <div className="mt-2 mb-2 px-2 py-3 flex flex-grow place-content-evenly align-middle items-center h-auto font-medium space-x-2 text-black shadow-lg  bg-white">
        <div className="text-lg">Room: </div>
        <div className="text-sm">{roomId}</div>
        <CopyButton copyText={roomId} />
      </div>

      <PlayerList playersList={roomState.players} 
        playerId={roomState.playerId} 
        gameStatus={roomState.gameStatus} 
        sendCommand={sendCommand} />
      {promptEl}
      {gameEl}
      <CardSelector cards={[{cardId: 1},{cardId: 2}, {cardId: 3}]} />
    </div>
  );
};

export default GameRoom;