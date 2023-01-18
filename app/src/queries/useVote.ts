import { MutationKey, useMutation } from "@tanstack/react-query";
import { apiClient } from "../utils/apiClient";

type VoteArgs = {
  cardId: number;
};

type VoteResponse = {
  cardId: number;
};

const vote = async (args: VoteArgs) => {
  const response = await apiClient.post<VoteResponse>("/game_command", {
    command: "vote",
    payload: {
      ...args,
    },
  });
  return response.data;
};

export const useVote = () => {
  const key = ["vote"] as MutationKey;
  return useMutation(key, vote);
};
