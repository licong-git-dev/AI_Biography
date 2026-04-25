import { create } from 'zustand';
import type { Chapter } from '../types';
import { loadChapters } from '../data/chapters';

interface ChapterStore {
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  activeId: string | null;

  load: () => Promise<void>;
  setActive: (id: string | null) => void;
  getById: (id: string) => Chapter | undefined;
  getByNumber: (n: number) => Chapter | undefined;
}

export const useChapterStore = create<ChapterStore>((set, get) => ({
  chapters: [],
  loading: false,
  error: null,
  loaded: false,
  activeId: null,

  load: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const chapters = await loadChapters();
      set({ chapters, loading: false, loaded: true, error: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ loading: false, error: msg, loaded: false });
    }
  },

  setActive: (id) => set({ activeId: id }),
  getById: (id) => get().chapters.find((c) => c.id === id),
  getByNumber: (n) => get().chapters.find((c) => c.number === n),
}));
