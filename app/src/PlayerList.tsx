
interface PlayerListProps {
  playersList: string[]
}

const PlayerList = ({ playersList }: PlayerListProps) => {

  // Create a list of players
  const players: JSX.Element[] = playersList.map((player: string, idx: number) => {
    return <div key={idx} className="player">
      {player}
    </div>
  });

  return (
    <div id="playerList" className="mt-2 mb-1 grid grid-cols-1 h-auto items-center font-medium space-x-4 text-black shadow-lg rounded-xl bg-white">
      {players}
    </div>
  );
}

export default PlayerList;