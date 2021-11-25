import logo from './logo.svg';
import './App.css';
import { useDispatch, useSelector } from 'react-redux';
import CreateRoomButton from './CreateRoomButton';
import { RoomState } from './reducers/roomReducer';

function App() {

  const dispatch = useDispatch();

  const roomStatus = useSelector<RoomState, RoomState["status"]>(
    (state) => state.status
  );

  const roomId = useSelector<RoomState, RoomState["id"]>(
    (state) => state.id
  );

  const onCreateRoom = () => {
    console.log("oncreate")
    dispatch({type: 'JOIN', payload: {id: 132}});
  }

  console.log(roomStatus, roomId);

  return (
    <div className="App">
      <header className="App-header">
        { roomStatus === 'not_joined' ? <CreateRoomButton createRoom={onCreateRoom}/> : <p>Room: {roomId}</p> }
      </header>
    </div>
  );
}

export default App;
