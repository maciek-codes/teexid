/**
 *
 * @returns token string identifying a connection to a room
 */
const TOKEN_NAME = "room_token";

type Token = {
  playerId: string;
  roomId: string;
  playerName: string;
};

export const getRoomToken = (): string => {
  const roomToken = window.localStorage.getItem(TOKEN_NAME);
  if (roomToken !== null && roomToken !== "") {
    return roomToken;
  }
  return "";
};

/**
 *
 * @returns token string identifying a connection to a room
 */
export const updateRoomToken = (new_token: string) => {
  window.localStorage.setItem(TOKEN_NAME, new_token);
};

export const getPlayerIdFromToken = (): string | null => {
  const token = getRoomToken();
  try {
    const parsed = JSON.parse(atob(token.split(".")[1])) as Token;
    return parsed.playerId;
  } catch (e) {
    return null;
  }
};
