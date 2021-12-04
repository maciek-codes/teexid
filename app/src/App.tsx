import './App.css';
import { useDispatch, useSelector } from 'react-redux';
import CreateRoomButton from './CreateRoomButton';
import { RoomState } from './reducers/roomReducer';
import { joinRoom, thunkCreateRoom } from './middleware/createRoomMiddleware'

function App() {

  const dispatch = useDispatch();

  const roomStatus = useSelector<RoomState, RoomState["status"]>(
    (state) => state.status
  );

  const roomId = useSelector<RoomState, RoomState["id"]>(
    (state) => state.id
  );

  const onCreateRoom = () => {
    dispatch(thunkCreateRoom());
  }

  const onJoinRoom = (id: string) => {
    dispatch(joinRoom(id));
  }

  console.log(roomStatus, roomId);

  let entrace ;
  switch (roomStatus) {
    case 'joined': {
      entrace = <p>Room: {roomId}</p>;
      break;
    }
    case 'not_joined': {
      entrace = <CreateRoomButton createRoom={onCreateRoom} joinRoom={onJoinRoom}/>;
      break;
    }
    case 'loading': {
      entrace = <p>Loading...</p>
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        { entrace }
      </header>
    </div>
  );
}

export default App;
