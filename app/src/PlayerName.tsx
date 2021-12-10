import { useState } from "react";
import { Action } from "./App";

interface PlayerNameProps {
  playerName: string,
  sendCommand: (action: Action) => void;
}

const PlayerName = ({playerName, sendCommand}: PlayerNameProps) => {

  const [name, setName] = useState(playerName);
  const [isEditingName, setIsEditingName] = useState(false);

  const updateName = () => {
    setIsEditingName(false);
    sendCommand({ type: 'player/updateName', payload: name });
  }

  return isEditingName ?
    <input value={name} onChange={(val) => setName(val.currentTarget.value)}
      onBlur={updateName}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === "Escape") {
          updateName();
        }
      }} /> :
    <div className="grid grid-cols-1 h-16 items-center font-medium space-x-4 text-black shadow-lg rounded-xl bg-white">👋 Hello {name} <button onClick={() => setIsEditingName(true)}>✏️</button></div>;
  }

export default PlayerName;