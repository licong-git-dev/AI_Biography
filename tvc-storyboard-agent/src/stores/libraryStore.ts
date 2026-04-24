import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SavedHook {
  id: string;
  text: string;
  style?: string;
  why?: string;
  sourceEpisodeId?: string;
  savedAt: number;
}

export interface SavedStyle {
  id: string;
  name: string;
  /** 生成提示词（可复用到其它镜头作图） */
  prompt: string;
  /** 缩略图（可选；来源镜头的 keyframe data URL） */
  thumbnailUrl?: string;
  sourceShotId?: string;
  savedAt: number;
}

interface LibraryStore {
  hooks: SavedHook[];
  styles: SavedStyle[];

  addHook: (item: Omit<SavedHook, 'id' | 'savedAt'>) => void;
  removeHook: (id: string) => void;

  addStyle: (item: Omit<SavedStyle, 'id' | 'savedAt'>) => void;
  removeStyle: (id: string) => void;
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set) => ({
      hooks: [],
      styles: [],

      addHook: (item) =>
        set((s) => ({
          hooks: [
            {
              ...item,
              id: `hook-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
              savedAt: Date.now(),
            },
            ...s.hooks,
          ],
        })),
      removeHook: (id) =>
        set((s) => ({ hooks: s.hooks.filter((h) => h.id !== id) })),

      addStyle: (item) =>
        set((s) => ({
          styles: [
            {
              ...item,
              id: `style-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
              savedAt: Date.now(),
            },
            ...s.styles,
          ],
        })),
      removeStyle: (id) =>
        set((s) => ({ styles: s.styles.filter((st) => st.id !== id) })),
    }),
    {
      name: 'licong-library',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ hooks: state.hooks, styles: state.styles }),
    }
  )
);
