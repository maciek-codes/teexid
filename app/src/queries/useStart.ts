import { MutationKey, useMutation } from "@tanstack/react-query";
import { apiClient } from "../utils/apiClient";

type StartResponse = {};

const Start = async () => {
  const response = await apiClient.post<StartResponse>("/game_command", {
    command: "start",
    payload: {},
  });
  return response.data;
};

export const useStart = () => {
  const key = ["start"] as MutationKey;
  return useMutation(key, Start);
};
