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
import { Box, Container, Stack } from "@chakra-ui/react";
import Header from "./components/Header";
import DebugInfo from "./components/DebugInfo";

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
            <PlayerContextProvider>
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
                      px={[10, 5, 10]}
                      direction={{ base: "column", md: "row" }}
                    >
                      <Routes>
                        <Route path="/" element={<CreateRoomButton />} />
                        <Route path="/room/:roomId" element={<GameRoom />} />
                      </Routes>
                    </Stack>
                    <DebugInfo />
                  </Container>
                </Box>
              </ErrorBoundary>
            </PlayerContextProvider>
          </RoomContextProvider>
        </BrowserRouter>
      </WebSocketContextProvider>
    </QueryClientProvider>
  );
};

export default App;
