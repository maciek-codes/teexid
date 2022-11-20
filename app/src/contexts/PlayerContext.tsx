import React, {
  useContext,
  createContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "../hooks/useAuth";
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
  // Check local storage
  const storedName = useMemo(() => {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  }, []);

  const auth = useAuth();
  const { ownerId } = useRoom();
  const [name, setName] = useState<string>(storedName);

  const setNameCallback = useCallback(
    (name: string) => {
      setName(name);
      window.localStorage.setItem(NAME_KEY, name);
    },
    [setName]
  );

  return (
    <PlayerContext.Provider
      value={{
        id: auth.data?.playerId ?? null,
        name,
        isOwner: auth.data?.playerId === ownerId,
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
