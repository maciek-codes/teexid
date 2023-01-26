import React, {
  useContext,
  createContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRoomStore } from "../stores/RoomStore";

interface PlayerData {
  id: string;
  name: string;
  isOwner: boolean;
  setName: (name: string) => void;
}

const PlayerContext = createContext<PlayerData | null>(null);

type Props = {
  children: React.ReactNode;
};

const NAME_KEY = "55d78e7c-9f3e-49e4-9385-0ee53138972f";
const ID_KEY = "474170b0-affe-4d8e-a7ea-795e416697e6";

/**
 * Pick id for the user
 */
const getPlayerId = (): string => {
  const existingId = window.localStorage.getItem(ID_KEY);
  if (existingId !== null) {
    return existingId;
  }

  const newId = crypto.randomUUID();
  window.localStorage.setItem(ID_KEY, newId);
  return newId;
};

export const PlayerContextProvider: React.FC<Props> = ({ children }: Props) => {
  // Check local storage
  const storedName = useMemo(() => {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  }, []);

  const ownerId = useRoomStore((state) => state.ownerId);
  const [name, setName] = useState<string>(storedName);

  const setNameCallback = useCallback(
    (name: string) => {
      setName(name);
      window.localStorage.setItem(NAME_KEY, name);
    },
    [setName]
  );

  const playerId = getPlayerId();

  return (
    <PlayerContext.Provider
      value={{
        id: playerId,
        name: name,
        isOwner: playerId === ownerId,
        setName: setNameCallback,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerData => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("PlayerContextProvider needed");
  return ctx;
};
