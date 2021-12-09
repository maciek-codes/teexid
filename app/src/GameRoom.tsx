import { useState } from "react";
import { Action, RoomState } from "./App";

type GameRoomProps = {
  roomState: RoomState;
  sendCommand: (action: Action) => void;
};

const GameRoom = ({ roomState, sendCommand }: GameRoomProps) => {
  const [name, setName] = useState(roomState.playerName);
  const [isEditingName, setIsEditingName] = useState(false);

  const updateName = () => {
    setIsEditingName(false);
    sendCommand({ type: 'player/updateName', payload: name });
  }

  const nameComponent = isEditingName ?
    <input value={name} onChange={(val) => setName(val.currentTarget.value)}
      onBlur={updateName}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === "Escape") {
          updateName();
        }
      }} /> :
    <div>👋 Hello {name} <button onClick={() => setIsEditingName(true)}>✏️</button></div>;

  // Create a list of players
  const players: JSX.Element[] = roomState.players.map((player, idx) => {
    console.log("Adding " + player);
    const el = (<div key={idx} className="player">{player}</div>);
    console.log(el);
    return el;
  });

  return (
    <div>
      {nameComponent}
      <h1>Room: {roomState.id}</h1>
      <h1>Round: #0</h1>
      <section>
        <h1>Players: </h1>
        { players }
      </section>
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