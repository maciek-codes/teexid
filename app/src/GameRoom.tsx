import { Action, RoomState } from "./App";
import PlayerList from "./PlayerList";

type GameRoomProps = {
  roomState: RoomState;
  sendCommand: (action: Action) => void;
};

const GameRoom = ({ roomState, sendCommand }: GameRoomProps) => {
  
  return (
    <div id="room" className="room">
      <div className="mt-2 mb-1 grid grid-cols-1 h-16 items-center font-medium space-x-4 text-black shadow-lg rounded-xl bg-white">
        Room: {roomState.id}
      </div>

      <div className="mt-2 mb-1 grid grid-cols-1 h-16 items-center font-medium space-x-4 text-black shadow-lg rounded-xl bg-white">Round: #0</div>

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