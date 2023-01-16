import { useMutation } from "@tanstack/react-query";
import { useRoom } from "../contexts/RoomContext";
import { updateRoomToken } from "../hooks/useAuth";
import Player from "../models/Player";
import { RoomState, TurnState } from "../types";
import { getHost } from "../utils/config";

type JoinArgs = {
  roomName: string;
  playerName: string;
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
  lastSubmittedCard: number;
};

const joinRoom = (params: JoinArgs) => {
  return fetch(`${getHost()}/join_room`, {
    method: "POST",
    body: JSON.stringify(params),
  }).then((response) => {
    if (!response.ok) {
      throw new Error("Can't auth " + response.status);
    }

    return response.json() as Promise<Response>;
  });
};

export const useJoinRoom = (roomName: string) => {
  const joinQuery = useMutation(["join_room", roomName], joinRoom);
  const { dispatch } = useRoom();
  if (joinQuery.isSuccess && joinQuery.data?.roomToken) {
    updateRoomToken(joinQuery.data.roomToken);
    dispatch({
      type: "on_joined",
      payload: {
        ...joinQuery.data,
      },
    });
  }
  return joinQuery;
};
