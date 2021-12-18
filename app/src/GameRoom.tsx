import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Action, RoomState } from "./App";
import PlayerList from "./PlayerList";

type GameRoomProps = {
  roomState: RoomState;
  sendCommand: (action: Action) => void;
};

const GameRoom = ({ roomState, sendCommand }: GameRoomProps) => {
  
  return (
    <div id="room" className="room">
      <div className="mt-2 mb-2 px-2 py-3 grid grid-cols-1 h-auto items-center font-medium space-x-2 text-black shadow-lg  bg-white">
        Room: {roomState.id}
        <button onClick={() => {
          navigator.clipboard.writeText(roomState.id)
        }}><FontAwesomeIcon icon={["far", "copy"]} /></button>
      </div>

      <PlayerList playersList={roomState.players} playerId={roomState.playerId} sendCommand={sendCommand} />
      <section>
        <p>Current prompt: "THIS IS FUNNY PROMPT"</p>
      </section>
      <section>
        <h2>Submitted cards</h2>
        <button>Vote</button>
      </section>
    </div>
  );
};

export default GameRoom;