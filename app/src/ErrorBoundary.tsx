import { Alert, AlertIcon, AlertTitle, Box } from "@chakra-ui/react";
import React from "react";
import { useSocket } from "./contexts/WebsocketContext";

interface ChildrenProps {
  children: React.ReactNode;
}

export const ErrorBoundary: React.FC<ChildrenProps> = ({
  children,
}: ChildrenProps) => {
  const { error } = useSocket();
  return (
    <Box>
      {error !== null ? (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>{error.message}</AlertTitle>
        </Alert>
      ) : null}
      {children}
    </Box>
  );
};
