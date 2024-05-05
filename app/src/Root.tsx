import React from "react";
import { Box, Container, Stack } from "@chakra-ui/react";

import Header from "./components/Header";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";

const queryClient = new QueryClient();

const Root: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Box background="#5e3788" minH="100vh">
        <Header />
        <Container
          minH="100vh"
          maxW="1366px"
          margin="0px auto"
          padding={0}
          centerContent={true}
        >
          <Box alignSelf="stretch" px="2" py="3">
            <Outlet />
          </Box>
        </Container>
      </Box>
    </QueryClientProvider>
  );
};

export default Root;
