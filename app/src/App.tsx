import "./App.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { library } from "@fortawesome/fontawesome-svg-core";
import { far } from "@fortawesome/free-regular-svg-icons";

import { PlayerContextProvider } from "./contexts/PlayerContext";
import { RoomContextProvider } from "./contexts/RoomContext";
import { GameInit } from "./GameInit";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GameRoom from "./GameRoom";
import { WebSocketContextProvider } from "./contexts/WebsocketContext";

// Font awesome icons
library.add(far);

const App = () => {
  const queryClient = new QueryClient();

  return (
    <WebSocketContextProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <RoomContextProvider>
                  <PlayerContextProvider>
                    <GameInit />
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
      </QueryClientProvider>
    </WebSocketContextProvider>
  );
};

export default App;
