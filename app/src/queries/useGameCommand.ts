import { MutationKey, useMutation } from "@tanstack/react-query";
import { getRoomToken } from "../hooks/useAuth";
import apiClient from "../utils/apiClient";

type HistoryResponse = {};

const postCommand = async (cmd: string, payload: unknown) => {
  const response = await apiClient.post<HistoryResponse>(
    "/game_command",
    {
      command: cmd,
      payload,
    },
    {
      headers: {
        "X-Game-Token": getRoomToken(),
      },
    }
  );
  return response.data;
};

export const useGameCommand = (cmd: string) => {
  const key = [cmd] as MutationKey;
  const self = this;
  return useMutation(key, postCommand.bind(self, cmd));
};
