import "./App.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { library } from "@fortawesome/fontawesome-svg-core";
import { far } from "@fortawesome/free-regular-svg-icons";

import { PlayerContextProvider } from "./contexts/PlayerContext";
import { RoomContextProvider } from "./contexts/RoomContext";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GameRoom from "./GameRoom";
import { WebSocketContextProvider } from "./contexts/WebsocketContext";
import CreateRoomButton from "./CreateRoomButton";
import PlayerName from "./PlayerName";

// Font awesome icons
library.add(far);

const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketContextProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <RoomContextProvider>
                  <PlayerContextProvider>
                    <PlayerName />
                    <CreateRoomButton />
                  </PlayerContextProvider>
                </RoomContextProvider>
              }
            />
            <Route
              path="/room/:roomId"
              element={
                <RoomContextProvider>
                  <PlayerContextProvider>
                    <GameRoom />
                  </PlayerContextProvider>
                </RoomContextProvider>
              }
            />
          </Routes>
        </BrowserRouter>
      </WebSocketContextProvider>
    </QueryClientProvider>
  );
};

export default App;
