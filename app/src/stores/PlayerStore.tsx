import { create } from "zustand";

interface PlayerData {
  id: string;
  name: string;
  isOwner: boolean;
  setName: (name: string) => void;
  setIsOwner: (isOwner: boolean) => void;
}

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

export const usePlayerStore = create<PlayerData>((set) => ({
  id: getPlayerId(),
  name: window.localStorage.getItem(NAME_KEY) ?? "",
  setName: (newName: string) => {
    set({ name: newName });
    window.localStorage.setItem(NAME_KEY, newName);
  },
  isOwner: false,
  setIsOwner: (owner: boolean) => set({ isOwner: owner }),
}));
