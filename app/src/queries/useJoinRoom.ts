import { MutationKey, useMutation } from "@tanstack/react-query";
import { useRoom } from "../contexts/RoomContext";
import { getRoomToken, updateRoomToken } from "../hooks/useAuth";
import Player from "../models/Player";
import { RoomState, TurnState } from "../types";
import apiClient from "../utils/apiClient";

type JoinArgs = {
  roomName: string;
  playerName: string;
  playerId: string;
};

type Response = {
  roomToken: string;
  roomId: string;
  ownerId: string;
  playerId: string;
  cards: number[];
  roomState: RoomState;
  turnState: TurnState;
  players: Player[];
  story: string;
  cardsSubmitted: number[];
  storyPlayerId: string;
};

const joinRoom = async (params: JoinArgs) => {
  console.log("Fetching data for ", params);
  return await apiClient.post<Response>("/join_room", params, {
    headers: {
      "X-Game-Token": getRoomToken(),
    },
  });
};

export const useJoinRoom = () => {
  const { dispatch } = useRoom();
  const key = ["join_room"] as MutationKey;
  return useMutation(key, joinRoom, {
    onSuccess: (response) => {
      console.log("new data", response.data);
      updateRoomToken(response.data.roomToken);
      dispatch({
        type: "on_joined",
        payload: {
          ...response.data,
        },
      });
    },
  });
};
