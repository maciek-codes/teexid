import React from "react";
import { Box, Container, Stack } from "@chakra-ui/react";

import { PlayerContextProvider } from "./contexts/PlayerContext";
import Header from "./components/Header";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { Lobby } from "./Lobby";

const queryClient = new QueryClient();

const Root: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <PlayerContextProvider>
        <Box background="#5e3788" minH="100vh">
          <Header />
          <Container
            minH="100vh"
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
              <Lobby />
              <Outlet />
            </Stack>
          </Container>
        </Box>
      </PlayerContextProvider>
    </QueryClientProvider>
  );
};

export default Root;
