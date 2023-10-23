import { useWebsocketContext } from "../context/WebsocketContextProvider";
import { useGameStore } from "../stores/GameStore";

export const useJoinRoom = (): (() => void) => {
  const [playerName, roomName, setRoomState] = useGameStore((state) => [
    state.playerName,
    state.roomName,
    state.setRoomState,
  ]);
  const { send } = useWebsocketContext();
  return () => {
    console.log("sending join room");
    send({
      type: "join_room",
      payload: { roomName: roomName, playerName },
    });
    setRoomState("joining");
  };
};
