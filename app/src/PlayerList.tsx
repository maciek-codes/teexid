import { ServerAction } from "./App";
import Player from "./models/Player";
import { GameStatus } from "./models/RoomState";

interface PlayerListProps {
  playersList: Player[]
  playerId: string,
  gameStatus: GameStatus
  sendCommand: (action: ServerAction) => void
}

const PlayerList = ({ playersList, playerId, gameStatus, sendCommand }: PlayerListProps) => {

  // Create a list of players
  const players: JSX.Element[] = playersList.map((player: Player, idx: number) => {

    const isSelf = player.id === playerId
    const canChange = isSelf && gameStatus === 'waiting'
    return <div key={idx} className="player flex items-center align-middle flex-row">

      <div>{player.name}</div>
      <input className="input checkbox" type="checkbox" disabled={!canChange} checked={player.ready} onChange={() => {
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