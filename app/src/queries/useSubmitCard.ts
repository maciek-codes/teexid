import { MutationKey, useMutation } from "@tanstack/react-query";
import { getRoomToken } from "../hooks/useAuth";
import apiClient from "../utils/apiClient";

type SubmitResponse = {
  submittedCard: number;
};

const submitCard = async (cardId: number) => {
  const response = await apiClient.post<SubmitResponse>(
    "/game_command",
    {
      command: "submit_card",
      payload: {
        cardId,
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

export const useSubmitCard = (turnNumber: number) => {
  const key = ["submit_card", turnNumber] as MutationKey;
  return useMutation(key, submitCard);
};
