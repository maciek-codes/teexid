import { useEffect, useRef, useState } from 'react';
import './App.css';
import CreateRoomButton from './CreateRoomButton';
import GameRoom from './GameRoom';
import PlayerName from './PlayerName';

export interface RoomState {
  id: string,
  playerName: string,
  players: string[]
}

const initialState: RoomState = {
  id: '',
  playerName: "P#1",
  players: ["P#1"]
};

type JoinedStatus = 'joined' | 'loading' | 'not_joined';

interface GameMessage {
  type: 'onjoined' | 'onplayersupdated' |
  'onturnaction'
  payload: any
}

export type Action = {
  type: 'room/join' | 'room/create' | 'room/enter' | 'player/updateName',
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
    ws.current?.send(JSON.stringify(cmd));
  }

  useEffect(() => {
    try {
      if (!ws.current && roomState.id) {
        ws.current = new WebSocket('ws://localhost:8080/rooms/' + roomState.id);
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
                }
              });
              break;
            }
            case 'onplayersupdated': {
              setRoomState({ ...roomState, players: msg.payload.players });
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
      const response = await (await fetch('http://localhost:8080/rooms', { method: "POST" })).json();
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

  let entrace;
  switch (joinStatus) {
    case 'joined': {
      entrace = <GameRoom roomState={roomState} sendCommand={sendCommand} />;
      break;
    }
    case 'not_joined': {
      entrace = <CreateRoomButton createRoom={onCreateRoom} joinRoom={onJoinRoom} />;
      break;
    }
    case 'loading': {
      entrace = <p>Loading...</p>
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <PlayerName sendCommand={sendCommand} playerName={roomState.playerName} />
        {entrace}
      </header>
    </div>
  );
}

export default App;
