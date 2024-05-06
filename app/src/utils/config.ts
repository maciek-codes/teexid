export const getWsHost = (): string => {
  if (process.env.NODE_ENV !== "production") {
    return "ws://localhost:4000/ws";
  }
  return "wss://teexit.maciek.codes:8080/ws";
};

export const getHost = (): string => {
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8080";
  }
  return "https://teexit.maciek.codes:8080";
};
