import { useQuery } from "@tanstack/react-query";
import { getHost } from "../utils/config";

interface Token {
  playerId: string;
  token: string;
}

const getAuthToken = (): Promise<Token> => {
  if (
    window.sessionStorage.getItem("token") !== null &&
    window.sessionStorage.getItem("playerId") !== null
  ) {
    return Promise.resolve({
      token: window.sessionStorage.getItem("token")!,
      playerId: window.sessionStorage.getItem("playerId")!,
    } as Token);
  }

  window.sessionStorage.removeItem("token");
  window.sessionStorage.removeItem("playerId");
  return fetch(`${getHost()}/auth`, { method: "POST" }).then((response) => {
    if (!response.ok) {
      throw new Error("Can't auth " + response.status);
    }

    return response.json() as Promise<Token>;
  });
};

export const useAuth = () => {
  // Check session storage first
  const authQuery = useQuery(["auth"], getAuthToken);
  if (authQuery.isFetched && authQuery.data?.token) {
    window.sessionStorage.setItem("playerId", authQuery.data.playerId);
    window.sessionStorage.setItem("token", authQuery.data.token);
  }
  return authQuery;
};
