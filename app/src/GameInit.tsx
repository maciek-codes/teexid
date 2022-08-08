import React from "react";
import CreateRoomButton from "./CreateRoomButton";
import PlayerName from "./PlayerName";


export type ServerAction = {
    type: 'room/join' | 'room/create' | 'room/enter' |
    'player/updateName' | 'player/ready',
    payload: any
};

export const GameInit: React.FC = () => {
    return (
        <div className="App">
            <header className="App-header">
                <PlayerName />
                <CreateRoomButton />
            </header>
        </div>
    );
};
