import React, {
  useContext,
  createContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { getPlayerIdFromToken } from "../hooks/useAuth";
import { useRoom } from "./RoomContext";

interface PlayerData {
  id: string | null;
  name: string | null;
  isOwner: boolean;
  setName: (name: string) => void;
}

const PlayerContext = createContext<PlayerData | null>(null);

type Props = {
  children: React.ReactNode;
};

const NAME_KEY = "55d78e7c-9f3e-49e4-9385-0ee53138972f";

export const PlayerContextProvider: React.FC<Props> = ({ children }: Props) => {
  // Check sessionStorage
  const storedName = useMemo(() => {
    return window.sessionStorage.getItem(NAME_KEY) ?? "";
  }, []);

  const { ownerId } = useRoom();
  const [name, setName] = useState<string>(storedName);

  const setNameCallback = useCallback(
    (name: string) => {
      setName(name);
      window.sessionStorage.setItem(NAME_KEY, name);
    },
    [setName]
  );

  return (
    <PlayerContext.Provider
      value={{
        id: getPlayerIdFromToken(),
        name,
        isOwner: getPlayerIdFromToken() === ownerId,
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
