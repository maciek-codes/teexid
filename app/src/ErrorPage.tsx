import { Alert, AlertIcon, AlertTitle, Box } from "@chakra-ui/react";
import React from "react";
import { useRouteError } from "react-router-dom";

export const ErrorPage: React.FC = () => {
  const error = useRouteError() as any;
  return (
    <>
      {error && (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>
            <i>{error.statusText || error.message}</i>
          </AlertTitle>
        </Alert>
      )}
    </>
  );
};
