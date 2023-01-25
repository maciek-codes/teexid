import { MutationKey, useMutation } from "@tanstack/react-query";
import { getRoomToken } from "../hooks/useAuth";
import apiClient from "../utils/apiClient";

type SubmitStoryArgs = {
  story: string;
  cardId: number;
};

type SubmitResponse = {
  cardId: number;
  story: string;
};

const submitStory = async (args: SubmitStoryArgs) => {
  const response = await apiClient.post<SubmitResponse>(
    "/game_command",
    {
      command: "submit_story",
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

export const useSubmitStory = (turnNumber: number) => {
  const key = ["submit_story", turnNumber] as MutationKey;
  return useMutation(key, submitStory);
};
