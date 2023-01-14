import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import reportWebVitals from "./reportWebVitals";

import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/700.css";

import { theme } from "./theme";

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <>
      {localStorage.setItem("chakra-ui-color-mode", "light")}
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme} resetCSS={true}>
        <App />
      </ChakraProvider>
    </>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
