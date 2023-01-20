import { MutationKey, useMutation } from "@tanstack/react-query";
import { getRoomToken } from "../hooks/useAuth";
import apiClient from "../utils/apiClient";

type ReadyResponse = {};

const Ready = async () => {
  const response = await apiClient.post<ReadyResponse>(
    "/game_command",
    {
      command: "ready",
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

export const useReady = () => {
  const key = ["ready"] as MutationKey;
  return useMutation(key, Ready);
};
