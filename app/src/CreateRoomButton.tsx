import React from "react";

interface CreateRoomButtonProps {
    createRoom(): void
}

const CreateRoomButton: React.FC<CreateRoomButtonProps> = ({createRoom}) => {
    const createRoomClick = () => {
        createRoom();
    }
    return (
        <div className="flex flex-col space-y-4 p-6">
            <button className="rounded-full bg-purple-700 text-white" onClick={createRoomClick}>Create room</button>
            <input className="rounded-full border-2 border-gray-200" type="text"></input>
            <button className="rounded-full bg-purple-700 text-white" onClick={createRoomClick}>Join</button>
        </div>
    )
}

export default CreateRoomButton;