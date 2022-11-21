import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../models/Card";
import Player from "../models/Player";
import { ResponseMsg, RoomState, TurnState } from "../types";
import { useSocket } from "./WebsocketContext";

type JoinedState = "not_joined" | "joining" | "joined";

type CurrentRoomState = {
  roomId: string;
  ownerId: string;
  joinedState: JoinedState;
  turnState: TurnState;
  roomState: RoomState;
  storyPlayerId: string;
  cards: Card[];
  storyCards: Card[];
  players: Player[];
  story: string;
};

const defaultRoomState: CurrentRoomState = {
  roomId: "",
  turnState: "not_started",
  roomState: "waiting",
  ownerId: "",
  joinedState: "not_joined",
  cards: [],
  storyPlayerId: "",
  storyCards: [],
  players: [],
  story: "",
};

const RoomContext = createContext<CurrentRoomState>(defaultRoomState);

type Props = { children: ReactNode };

const roomStateReducer = (
  prevState: CurrentRoomState,
  { type, payload }: ResponseMsg
): CurrentRoomState => {
  switch (type) {
    case "on_room_created":
    case "on_players_updated":
      return {
        ...prevState,
        ...payload,
      };
    case "on_joined": {
      return {
        ...prevState,
        ...payload,
        cards: payload.cards.map((cardId) => ({ cardId } as Card)),
        storyCards: payload.cardsSubmitted.map((cardId) => {
          return { cardId } as Card;
        }),
        joinedState: "joined",
      };
    }
    case "on_room_state_updated": {
      return {
        ...prevState,
        ...payload,
        storyCards: payload.cardsSubmitted.map((cardId) => {
          return { cardId } as Card;
        }),
      };
    }
    case "on_cards": {
      return {
        ...prevState,
        cards: payload.cards.map((cardId) => ({ cardId } as Card)),
      };
    }
    default:
      return prevState;
  }
};

export const RoomContextProvider: React.FC<Props> = ({ children }: Props) => {
  const { addMsgListener, removeMsgListener } = useSocket();
  const navigate = useNavigate();
  const roomId = useParams().roomId ?? "";

  const initialState: CurrentRoomState = {
    ...defaultRoomState,
    roomId,
  };

  const [state, dispatch] = useReducer(roomStateReducer, initialState);

  const onMsg = useCallback(
    (msg: ResponseMsg) => {
      switch (msg.type) {
        case "error": {
          if (msg.payload.type === "room_not_found") {
            navigate("/");
          }
          break;
        }
        default:
          dispatch(msg);
          break;
      }
    },
    [navigate, dispatch]
  );

  useEffect(() => {
    addMsgListener(onMsg);
    return () => {
      removeMsgListener(onMsg);
    };
  }, [addMsgListener, removeMsgListener, onMsg]);

  return (
    <RoomContext.Provider
      value={{
        ...state,
        roomId: state.roomId === "" ? roomId : state.roomId,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = (): CurrentRoomState => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("RoomContextProvider required");
  return ctx;
};
