import React from "react";
import CreateRoomButton from "./CreateRoomButton";
import PlayerName from "./PlayerName";


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
