export const getWsHost = (): string => {
  if (process.env.NODE_ENV !== "production") {
    return "ws://localhost:8080/ws";
  }
  return "wss://game.teexit.maciek.codes/ws";
};

export const getHost = (): string => {
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8080";
  }
  return "https://game.teexit.maciek.codes";
};
