import { useEffect, useRef, useState } from 'react';
import './App.css';
import CreateRoomButton from './CreateRoomButton';
import GameRoom from './GameRoom';
import Player from './models/Player';
import PlayerName from './PlayerName';

import { library } from '@fortawesome/fontawesome-svg-core'
import { far } from '@fortawesome/free-regular-svg-icons'

// Font awesome icons
library.add(far);

type GameState = 'waiting' | 'playing' | 'ended';

export interface RoomState {
  id: string,
  playerId: string,
  playerName: string,
  players: Player[]
  state: GameState
}

const initialState: RoomState = {
  id: '',
  playerId: '',
  playerName: '',
  players: [],
  state: 'waiting'
};

type JoinedStatus = 'joined' | 'loading' | 'not_joined';

interface GameMessage {
  type: 'onjoined' | 'onplayersupdated' |
  'onturnaction' | 'onroomstateupdated'
  payload: any
}

export type Action = {
  type: 'room/join' | 'room/create' | 'room/enter' |
    'player/updateName' | 'player/ready',
  payload: any
};

function App() {
  const ws = useRef<WebSocket|null>(null);

  const [roomState, setRoomState] = useState<RoomState>(initialState);
  const [joinStatus, setJoinStatus] = useState<JoinedStatus>('not_joined')

  const sendCommand = (action: Action) => {
    const cmd = {
      type: action.type,
      data: action.payload
    };
    const commandStr = JSON.stringify(cmd);
    console.log("Sending command", commandStr)
    ws.current?.send(commandStr);
  }

  useEffect(() => {
    try {
      if (!ws.current && roomState.id) {
        ws.current = new WebSocket(
          'ws://localhost:8080/rooms/' 
          + roomState.id 
          + '?playerName=' + roomState.playerName );

        ws.current.onopen = (ev: Event) => {
          console.log("Connected to the room.");
        };

        ws.current.onmessage = (ev: MessageEvent) => {
          console.log("Message: " + ev.data);
          const msg = JSON.parse(ev.data) as GameMessage;
          switch (msg.type) {
            case 'onjoined': {
              setJoinStatus('joined');
              setRoomState(prevState => {
                return {
                  ...prevState,
                  id: msg.payload.roomId,
                  playerId: msg.payload.playerId,
                  isOwner: msg.payload.ownerId === msg.payload.playerId
                }
              });
              break;
            }
            case 'onplayersupdated': {
              setRoomState({ ...roomState, players: msg.payload.players });
              break;
            }
            case 'onroomstateupdated': {
              setRoomState({...roomState, state: msg.payload.state});
              break;
            }
            default:
              break;
          }
        }

        ws.current.onerror = (ev: Event) => {
          console.error(ev);
        }

        ws.current.onclose = (ev: Event) => {
          console.log("Closing");
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [roomState]);

  const onCreateRoom = async () => {
    setJoinStatus("loading");
    try {
      const response = await (await fetch('http://localhost:8080/rooms', { 
        method: "POST",
      })).json();
      setRoomState({ ...roomState, id: response.id });
    } catch (err) {
      setJoinStatus("not_joined");
      setRoomState({ ...roomState, id: '' });
    }
  };

  const onJoinRoom = (id: string) => {
    setJoinStatus("loading");
    setRoomState({ ...roomState, id: id });
  }

  const onPlayerNameChanged = (name: string) => {
    setRoomState({
      ...roomState,
      playerName: name
    });
  }

  let entrace;
  if (roomState.playerName) {
    switch (joinStatus) {
      case 'joined': {
        entrace = (
          <div className="transition duration-150 ease-in-out">
            <GameRoom roomState={roomState} sendCommand={sendCommand} />
          </div>
        );
        break;
      }
      case 'not_joined': {
        entrace = (
          <div className="transition duration-150 ease-in-out">
            <CreateRoomButton createRoom={onCreateRoom} joinRoom={onJoinRoom} />
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
        <PlayerName sendCommand={sendCommand} playerName={roomState.playerName} 
          onNameChanged={onPlayerNameChanged} />
        {entrace}
      </header>
    </div>
  );
}

export default App;
