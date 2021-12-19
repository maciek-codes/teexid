import { useEffect, useReducer, useRef } from 'react';
import './App.css';
import CreateRoomButton from './CreateRoomButton';
import GameRoom from './GameRoom';
import PlayerName from './PlayerName';

import { library } from '@fortawesome/fontawesome-svg-core'
import { far } from '@fortawesome/free-regular-svg-icons'
import RoomState from './models/RoomState';
import reducer, { GameMessage } from './RoomStateReducer';

// Font awesome icons
library.add(far);

const initialState: RoomState = {
  id: '',
  playerId: '',
  playerName: '',
  players: [],
  state: 'waiting',
  joinedStatus: 'not_joined'
};

export type Action = {
  type: 'room/join' | 'room/create' | 'room/enter' |
  'player/updateName' | 'player/ready',
  payload: any
};

const App = () => {
  const ws = useRef<WebSocket | null>(null);

  const [state, dispatch] = useReducer(reducer, initialState);

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
    if (!ws.current && state.id) {
      ws.current = new WebSocket(
        'ws://localhost:8080/rooms/'
        + state.id
        + '?playerName=' + state.playerName);

      ws.current.onopen = (ev: Event) => {
        console.log("Connected to the room.");
      };

      ws.current.onerror = (ev: Event) => {
        console.error(ev);
      }

      ws.current.onclose = (ev: Event) => {
        console.log("Closing");
      }

      ws.current.onmessage = (ev: MessageEvent) => {
        console.log("Message: " + ev.data);
        const msg = JSON.parse(ev.data) as GameMessage;
        dispatch(msg);
      }
    }
  }, [state.id, state.playerName]);

  const onCreateRoom = async () => {
    dispatch({type: 'joining', payload: null});
    try {
      const response = await (await fetch('http://localhost:8080/rooms', {
        method: "POST",
      })).json();
      dispatch({type: 'connect', payload: {id: response.id}});
    } catch (err) {
      dispatch({type: 'onjoinerror', payload: null});
    }
  };

  const onJoinRoom = (id: string) => {
    dispatch({type: 'joining', payload: null});
    dispatch({type: 'connect', payload: {id: id}});
  }

  const onPlayerNameChanged = (name: string) => {
    dispatch({type: 'playerName', payload: {
      playerName: name
    }});
  }

  let entrace;
  if (state.playerName) {
    switch (state.joinedStatus) {
      case 'joined': {
        entrace = (
          <div className="transition duration-150 ease-in-out">
            <GameRoom roomState={state} sendCommand={sendCommand} />
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
        <PlayerName sendCommand={sendCommand} playerName={state.playerName}
          onNameChanged={onPlayerNameChanged} />
        {entrace}
      </header>
    </div>
  );
}

export default App;
