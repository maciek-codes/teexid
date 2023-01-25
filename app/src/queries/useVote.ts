import { MutationKey, useMutation } from "@tanstack/react-query";
import { getRoomToken } from "../hooks/useAuth";
import apiClient from "../utils/apiClient";

type VoteArgs = {
  cardId: number;
};

type VoteResponse = {
  cardId: number;
};

const vote = async (args: VoteArgs) => {
  const response = await apiClient.post<VoteResponse>(
    "/game_command",
    {
      command: "vote",
      payload: {
        ...args,
      },
    },
    {
      headers: {
        "X-Game-Token": getRoomToken(),
      },
    }
  );
  return response.data;
};

export const useVote = (turnNumber: number) => {
  const key = ["vote", turnNumber] as MutationKey;
  return useMutation(key, vote);
};
