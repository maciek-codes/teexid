import React from "react";
import { Box, Container, Stack } from "@chakra-ui/react";

import { PlayerContextProvider } from "./contexts/PlayerContext";
import { RoomContextProvider } from "./contexts/RoomContext";
import Header from "./components/Header";
import DebugInfo from "./components/DebugInfo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WebSocketContextProvider } from "./contexts/WebsocketContext";
import { ErrorBoundary } from "./ErrorBoundary";
import { Outlet } from "react-router-dom";

const queryClient = new QueryClient();

const Root: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketContextProvider>
        <ErrorBoundary>
          <RoomContextProvider>
            <PlayerContextProvider>
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
                  ></Stack>
                  <Outlet />
                  <DebugInfo />
                </Container>
              </Box>
            </PlayerContextProvider>
          </RoomContextProvider>
        </ErrorBoundary>
      </WebSocketContextProvider>
    </QueryClientProvider>
  );
};

export default Root;
