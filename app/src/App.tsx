import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { library } from "@fortawesome/fontawesome-svg-core";
import { far } from "@fortawesome/free-regular-svg-icons";

import { PlayerContextProvider } from "./contexts/PlayerContext";
import { RoomContextProvider } from "./contexts/RoomContext";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GameRoom from "./GameRoom";
import { WebSocketContextProvider } from "./contexts/WebsocketContext";
import CreateRoomButton from "./CreateRoomButton";
import { ErrorBoundary } from "./ErrorBoundary";
import { Container } from "@chakra-ui/react";

// Font awesome icons
library.add(far);

/**
 * #d9832b  #de7e29
 * #433f4f #544b5b
 * #d6d1b7 #c5ccc3
 * #f6d06a #f9d45c
 * #833225 #873e36
 */

const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketContextProvider>
        <ErrorBoundary>
          <Container
            background="#efefef"
            maxWidth={["900px", "720px", "1600px"]}
            width="100%"
            margin="0px 0px"
            padding="0px"
            h="calc(100vh)"
          >
            <BrowserRouter>
              <Routes>
                <Route
                  path="/"
                  element={
                    <RoomContextProvider>
                      <PlayerContextProvider>
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
          </Container>
        </ErrorBoundary>
      </WebSocketContextProvider>
    </QueryClientProvider>
  );
};

export default App;
