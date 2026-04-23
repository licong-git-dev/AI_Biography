import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Episode, EpisodeStatus } from '../types';
import { SEED_EPISODES } from '../data/episodes';

interface EpisodeStore {
  episodes: Episode[];
  activeId: string | null;

  setActive: (id: string | null) => void;
  add: (episode: Episode) => void;
  addMany: (episodes: Episode[]) => void;
  update: (id: string, patch: Partial<Episode>) => void;
  remove: (id: string) => void;
  setStatus: (id: string, status: EpisodeStatus) => void;
  addShotId: (episodeId: string, shotId: string) => void;
  removeShotId: (episodeId: string, shotId: string) => void;
  resetToSeed: () => void;
  getById: (id: string) => Episode | undefined;
  bySeason: (season: number) => Episode[];
  nextEpisodeNumber: (season: number) => number;
}

export const useEpisodeStore = create<EpisodeStore>()(
  persist(
    (set, get) => ({
      episodes: SEED_EPISODES,
      activeId: null,

      setActive: (id) => set({ activeId: id }),

      add: (episode) =>
        set((state) => ({ episodes: [...state.episodes, episode] })),

      addMany: (episodes) =>
        set((state) => ({ episodes: [...state.episodes, ...episodes] })),

      update: (id, patch) =>
        set((state) => ({
          episodes: state.episodes.map((e) =>
            e.id === id ? { ...e, ...patch } : e
          ),
        })),

      remove: (id) =>
        set((state) => ({
          episodes: state.episodes.filter((e) => e.id !== id),
          activeId: state.activeId === id ? null : state.activeId,
        })),

      setStatus: (id, status) =>
        set((state) => ({
          episodes: state.episodes.map((e) =>
            e.id === id ? { ...e, status } : e
          ),
        })),

      addShotId: (episodeId, shotId) =>
        set((state) => ({
          episodes: state.episodes.map((e) =>
            e.id === episodeId
              ? { ...e, shotIds: [...(e.shotIds ?? []), shotId] }
              : e
          ),
        })),

      removeShotId: (episodeId, shotId) =>
        set((state) => ({
          episodes: state.episodes.map((e) =>
            e.id === episodeId
              ? {
                  ...e,
                  shotIds: (e.shotIds ?? []).filter((s) => s !== shotId),
                }
              : e
          ),
        })),

      resetToSeed: () => set({ episodes: SEED_EPISODES, activeId: null }),

      getById: (id) => get().episodes.find((e) => e.id === id),

      bySeason: (season) =>
        get().episodes.filter((e) => e.seasonNumber === season),

      nextEpisodeNumber: (season) => {
        const inSeason = get().episodes.filter(
          (e) => e.seasonNumber === season
        );
        if (inSeason.length === 0) return 1;
        return Math.max(...inSeason.map((e) => e.episodeNumber)) + 1;
      },
    }),
    {
      name: 'licong-episodes',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ episodes: state.episodes }),
    }
  )
);
