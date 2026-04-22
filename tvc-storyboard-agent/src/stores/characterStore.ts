import { create } from 'zustand';
import type { Character } from '../types';
import { SEED_CHARACTERS } from '../data/characters';

interface CharacterStore {
  characters: Character[];
  activeId: string | null;

  setActive: (id: string | null) => void;
  update: (id: string, patch: Partial<Character>) => void;
  setReferenceImage: (id: string, url: string) => void;
  getById: (id: string) => Character | undefined;
  byGroup: (group: Character['group']) => Character[];
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  characters: SEED_CHARACTERS,
  activeId: null,

  setActive: (id) => set({ activeId: id }),

  update: (id, patch) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    })),

  setReferenceImage: (id, url) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, referenceImageUrl: url } : c
      ),
    })),

  getById: (id) => get().characters.find((c) => c.id === id),
  byGroup: (group) => get().characters.filter((c) => c.group === group),
}));
