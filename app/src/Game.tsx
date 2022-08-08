import React from "react";

import { Box, Grid, GridItem, Text} from "@chakra-ui/react";
import { PlayerList } from "./PlayerList";
import PlayerName from "./PlayerName";
import { usePlayer } from "./contexts/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRoom } from "./contexts/RoomContext";

interface CopyButtonProps {
    copyText: string;
};

const CopyButton: React.FC<CopyButtonProps> = ({copyText}: CopyButtonProps) => {
    return (
        <>
            <button onClick={() => {
                navigator.clipboard.writeText(copyText);
            } }>
                <FontAwesomeIcon icon={["far", "copy"]} />
            </button>
        </>
    );
}


export const Game: React.FC = () => {
    const { name } = usePlayer();
    const  { roomId } = useRoom();
    return (
    <Box>
      <Grid templateColumns='repeat(3, 1fr)' templateRows="repeat(5, 2fr)">
        <GridItem>
          { name === '' ? <PlayerName /> : null }
        </GridItem>
        <GridItem colSpan={2} rowSpan={1}>
          <Text>Player: {name}</Text>
          <Text>Room: {roomId} <CopyButton copyText={roomId} /></Text>
        </GridItem>

        <GridItem colStart={3} colSpan={1} rowSpan={3}>
          <PlayerList />
        </GridItem>

        <GridItem colSpan={3} rowSpan={4}>
          <Text> Game here...</Text>
        </GridItem>
      </Grid>
    </Box>
    );
}