import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import Player from "./models/Player";

const PlayerList = () => {

  const room = useRoom();
  const {id} = usePlayer();
  const playersList = room.players;
  const gameStatus = room.gameStatus;

  // Create a list of players
  const players: JSX.Element[] = playersList.map((player: Player, idx: number) => {

    const isSelf = player.id === id
    const canChange = isSelf && gameStatus === 'waiting'
    return <div key={idx} className="player flex items-center align-middle flex-row">

      <div>{player.name}</div>
      <input className="input checkbox" type="checkbox" disabled={!canChange} checked={player.ready} onChange={() => {
        console.log({ type: 'player/ready', payload: '' })
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