import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Action } from "./App";
import RoomState from "./models/RoomState";
import PlayerList from "./PlayerList";

type GameRoomProps = {
  roomState: RoomState;
  sendCommand: (action: Action) => void;
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
  if (roomState.state === 'playing') {
    gameEl = (
      <section>
        <p>Current prompt: "THIS IS FUNNY PROMPT"</p>
      </section>
    )
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

      <PlayerList playersList={roomState.players} playerId={roomState.playerId} sendCommand={sendCommand} />
      {gameEl}
      <section>
        <h2>Submitted cards</h2>
        <button>Vote</button>
      </section>
    </div>
  );
};

export default GameRoom;