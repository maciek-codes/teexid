import { MutationKey, useMutation } from "@tanstack/react-query";
import { apiClient } from "../utils/apiClient";

type SubmitStoryArgs = {
  story: string;
  cardId: number;
};

type SubmitResponse = {
  cardId: number;
  story: string;
};

const submitStory = async (args: SubmitStoryArgs) => {
  const response = await apiClient.post<SubmitResponse>("/game_command", {
    command: "submit_story",
    payload: {
      ...args,
    },
  });
  return response.data;
};

export const useSubmitStory = () => {
  const key = ["submit_story"] as MutationKey;
  return useMutation(key, submitStory);
};
