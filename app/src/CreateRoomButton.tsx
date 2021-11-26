import React, { useState } from "react";

interface CreateRoomButtonProps {
    createRoom(): void
    joinRoom(id: string): void
}

const CreateRoomButton: React.FC<CreateRoomButtonProps> = ({createRoom, joinRoom}) => {
    const [id, setId] = useState('');

    const createRoomClick = () => {
        createRoom();
    }

    const joinRoomClick = () => {
        joinRoom(id);
    }

    return (
        <div className="flex flex-col space-y-4 p-6">
            <button className="rounded-full bg-purple-700 text-white" onClick={createRoomClick}>Create room</button>
            <input className="rounded-full border-2 border-gray-200" type="text" 
                onChange={e => setId(e.target.value)}></input>
            <button className="rounded-full bg-purple-700 text-white" onClick={joinRoomClick}>Join</button>
        </div>
    )
}

export default CreateRoomButton;