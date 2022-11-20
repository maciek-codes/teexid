export const getWsHost = (): string => {
  if (process.env.NODE_ENV !== "production") {
    return "ws://localhost:8080/ws";
  }
  return "wss://orca-app-p8h8n.ondigitalocean.app/ws";
};

export const getHost = (): string => {
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8080";
  }
  return "https://orca-app-p8h8n.ondigitalocean.app";
};
