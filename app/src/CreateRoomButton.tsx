import { Button, Input, Stack } from "@chakra-ui/react";
import React, { useState } from "react";

interface CreateRoomButtonProps {
}

const CreateRoomButton: React.FC<CreateRoomButtonProps> = ({ }) => {
    const [id, setId] = useState('');

    const createRoomClick = () => {
        console.log("Create");
    }

    const joinRoomClick = () => {
        console.log("join");
    }

    return (
        <div className="flex flex-col space-y-4 p-6">
            <Stack>
                <Button onClick={createRoomClick} pb="10">Create room</Button>
    
                <Input type="text"
                    onChange={e => setId(e.target.value)}></Input>
                <Button className="rounded-full bg-purple-700 text-white" onClick={joinRoomClick}>Join</Button>
            </Stack>
        </div>
    )
}

export default CreateRoomButton;