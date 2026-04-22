import { create } from 'zustand';
import type { Episode, EpisodeStatus } from '../types';
import { SEED_EPISODES } from '../data/episodes';

interface EpisodeStore {
  episodes: Episode[];
  activeId: string | null;

  setActive: (id: string | null) => void;
  update: (id: string, patch: Partial<Episode>) => void;
  setStatus: (id: string, status: EpisodeStatus) => void;
  addShotId: (episodeId: string, shotId: string) => void;
  removeShotId: (episodeId: string, shotId: string) => void;
  getById: (id: string) => Episode | undefined;
  bySeason: (season: number) => Episode[];
}

export const useEpisodeStore = create<EpisodeStore>((set, get) => ({
  episodes: SEED_EPISODES,
  activeId: null,

  setActive: (id) => set({ activeId: id }),

  update: (id, patch) =>
    set((state) => ({
      episodes: state.episodes.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  setStatus: (id, status) =>
    set((state) => ({
      episodes: state.episodes.map((e) => (e.id === id ? { ...e, status } : e)),
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

  getById: (id) => get().episodes.find((e) => e.id === id),
  bySeason: (season) =>
    get().episodes.filter((e) => e.seasonNumber === season),
}));
