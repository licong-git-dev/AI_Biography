import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Character } from '../types';
import { SEED_CHARACTERS } from '../data/characters';

interface CharacterStore {
  characters: Character[];
  activeId: string | null;

  setActive: (id: string | null) => void;
  update: (id: string, patch: Partial<Character>) => void;
  setReferenceImage: (id: string, url: string) => void;
  resetCharacter: (id: string) => void;
  getById: (id: string) => Character | undefined;
  byGroup: (group: Character['group']) => Character[];
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set, get) => ({
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

      resetCharacter: (id) =>
        set((state) => {
          const seed = SEED_CHARACTERS.find((s) => s.id === id);
          if (!seed) return state;
          return {
            characters: state.characters.map((c) => (c.id === id ? seed : c)),
          };
        }),

      getById: (id) => get().characters.find((c) => c.id === id),
      byGroup: (group) => get().characters.filter((c) => c.group === group),
    }),
    {
      name: 'licong-characters',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ characters: state.characters }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { characters?: Character[] } | undefined;
        if (!persisted?.characters) return currentState;

        const persistedMap = new Map(
          persisted.characters.map((c) => [c.id, c])
        );

        const merged = SEED_CHARACTERS.map((seed) => {
          const saved = persistedMap.get(seed.id);
          return saved ? { ...seed, ...saved } : seed;
        });

        persisted.characters.forEach((p) => {
          if (!merged.find((m) => m.id === p.id)) merged.push(p);
        });

        return { ...currentState, characters: merged };
      },
    }
  )
);
