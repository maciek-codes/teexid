
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Text } from "@chakra-ui/react";

import CardView from "./CardView";
import PlayerList from "./PlayerList";
import { TurnState } from "./models/RoomState";

import { Container } from "@chakra-ui/react";
import { useRoom } from "./contexts/RoomContext";
import { usePlayer } from "./contexts/PlayerContext";
import Card from "./models/Card";
import { useJoinRoom } from "./hooks/useJoinRoom";
import PlayerName from "./PlayerName";

type CopyButtonProps = {copyText: string};
const CopyButton = ({copyText}: CopyButtonProps) => {
  return (
    <button onClick={() => {
      navigator.clipboard.writeText(copyText)
    }}>
      <FontAwesomeIcon icon={["far", "copy"]} />
    </button>
  )
}

const GameRoom: React.FC = () => {

  const { roomId, gameStatus } = useRoom();
  const { name } = usePlayer();
  const [ turnState ] = useState<TurnState | null>(null);
  const playerCards: Card[] = [];
  const { isLoading, error } = useJoinRoom();
  
  let gameEl = null;
  let promptEl = null;
  if (gameStatus === 'playing') {

    if (turnState?.storyPrompt !== '') {
      promptEl = (
        <div>{turnState?.storyPrompt}</div>
      )
    }

    if (turnState?.turnStatus) {
      switch(turnState?.turnStatus ) {
        case 'writingStory': {
          let cards = playerCards.map(card =>
            <CardView key={card.cardId} card={card} />
          );
          gameEl = (
            <div>
              <div>Write story and select the card</div>
              <input className="input" placeholder="Story" />
              {cards}
              <button>Submit</button>
            </div>
          );
          break;
        }
        case 'waitingForStory': {
          gameEl = <span>Waitin for the story</span>;
          break;
        }
        case 'submittingCard': {
          gameEl = <span>Submitt</span>;
          break;
        }
        case 'waitingForOthers': {
          gameEl = <span>Waiting</span>;
          break;
        }
        case 'voting': {
          gameEl = <span>Voting</span>;
          break;
        }
        case 'voted': {
          gameEl = <span>Voted, waiting for others</span>;
        }
      }
    }
  } else {
    gameEl = (
      <section>
        <p>Waiting to start</p>
      </section>
    )
  }

  return (
    <Container>
      { name === '' ? (<PlayerName />) : null }
      {isLoading && error === null ? (<Text>LOADING</Text>) : null}
      {error ? (<Text>{error.message}</Text>) : null}
      <Box>
        <Text>Player: {name}</Text>
        <Text>Room: {roomId}</Text>
        <CopyButton copyText={roomId} />
      </Box>

      <PlayerList />
      {promptEl}
      {gameEl}
    </Container>
  );
};

export default GameRoom;