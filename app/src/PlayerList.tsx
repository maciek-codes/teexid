import { Action } from "./App";
import Player from "./models/Player";

interface PlayerListProps {
  playersList: Player[]
  playerId: string,
  sendCommand: (action: Action) => void
}

const PlayerList = ({ playersList, playerId, sendCommand }: PlayerListProps) => {

  // Create a list of players
  const players: JSX.Element[] = playersList.map((player: Player, idx: number) => {

    const isSelf = player.id === playerId;
    return <div key={idx} className="player flex items-center align-middle flex-row">

      <div>{player.name}</div>
      <input className="input checkbox" type="checkbox" disabled={!isSelf} checked={player.ready} onChange={() => {
        sendCommand({ type: 'player/ready', payload: '' })
      }}/>
    </div>
  });

  return (
    <div id="playerList" className="mt-2 mb-2 px-2 grid grid-cols-1 h-auto items-center font-medium space-x-4 text-black shadow-lg bg-white">
      <div>Players joined:</div>
      {players}
    </div>
  );
}

export default PlayerList;