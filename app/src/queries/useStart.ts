import { MutationKey, useMutation } from "@tanstack/react-query";
import { getRoomToken } from "../hooks/useAuth";
import apiClient from "../utils/apiClient";

type StartResponse = {};

const Start = async () => {
  const response = await apiClient.post<StartResponse>(
    "/game_command",
    {
      command: "start",
      payload: {},
    },
    {
      headers: {
        "X-Game-Token": getRoomToken(),
      },
    }
  );
  return response.data;
};

export const useStart = () => {
  const key = ["start"] as MutationKey;
  return useMutation(key, Start);
};
