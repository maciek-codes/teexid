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
import { Box, Container, Flex, Stack } from "@chakra-ui/react";
import Header from "./components/Header";

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
        <BrowserRouter>
          <RoomContextProvider>
            <ErrorBoundary>
              <Box background="#efefef">
                <Header />
                <Container
                  h="100vh"
                  maxW="1366px"
                  margin="0px auto"
                  padding={0}
                  centerContent={true}
                >
                  <Box alignSelf="stretch"></Box>
                  <Stack
                    maxW="container.xl"
                    align={"center"}
                    spacing={{ base: 8, md: 10 }}
                    py={{ base: 20, md: 28 }}
                    direction={{ base: "column", md: "row" }}
                  >
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <PlayerContextProvider>
                            <CreateRoomButton />
                          </PlayerContextProvider>
                        }
                      />
                      <Route
                        path="/room/:roomId"
                        element={
                          <PlayerContextProvider>
                            <GameRoom />
                          </PlayerContextProvider>
                        }
                      />
                    </Routes>
                  </Stack>
                </Container>
              </Box>
            </ErrorBoundary>
          </RoomContextProvider>
        </BrowserRouter>
      </WebSocketContextProvider>
    </QueryClientProvider>
  );
};

export default App;
