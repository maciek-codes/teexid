import React from "react";
import { usePlayer } from "./contexts/PlayerContext";
import { useRoom } from "./contexts/RoomContext";
import CreateRoomButton from "./CreateRoomButton";
import GameRoom from "./GameRoom";
import { useAuth } from "./hooks/useAuth";
import PlayerName from "./PlayerName";


export type ServerAction = {
    type: 'room/join' | 'room/create' | 'room/enter' |
    'player/updateName' | 'player/ready',
    payload: any
};

export const GameInit: React.FC = () => {
    const player = usePlayer();
    const { joinedStatus } = useRoom()

    let entrace;
    if (player?.name) {
        switch (joinedStatus) {
            case 'joined': {
                entrace = (
                    <div className="transition duration-150 ease-in-out">
                        <GameRoom />
                    </div>
                );
                break;
            }
            case 'not_joined': {
                entrace = (
                    <div className="transition duration-150 ease-in-out">
                        <CreateRoomButton />
                    </div>
                );
                break;
            }
            case 'loading': {
                entrace = <p>Loading...</p>
            }
        }
    }
    return (
        <div className="App">
            <header className="App-header">
                <PlayerName />
                {entrace}
            </header>
        </div>
    )
};