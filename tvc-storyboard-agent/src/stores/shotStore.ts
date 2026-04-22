import { create } from 'zustand';
import type { Shot, ShotGenStatus } from '../types';
import { SEED_SHOTS } from '../data/samples';

interface ShotStore {
  shots: Shot[];
  activeId: string | null;

  setActive: (id: string | null) => void;
  add: (shot: Shot) => void;
  addMany: (shots: Shot[]) => void;
  update: (id: string, patch: Partial<Shot>) => void;
  remove: (id: string) => void;
  setGenStatus: (id: string, status: ShotGenStatus) => void;
  setKeyframe: (id: string, url: string) => void;
  setPrompt: (id: string, prompt: string) => void;

  getById: (id: string) => Shot | undefined;
  byEpisode: (episodeId: string) => Shot[];
  getByNumber: (episodeId: string, number: string) => Shot | undefined;
}

export const useShotStore = create<ShotStore>((set, get) => ({
  shots: SEED_SHOTS,
  activeId: null,

  setActive: (id) => set({ activeId: id }),

  add: (shot) => set((state) => ({ shots: [...state.shots, shot] })),

  addMany: (shots) => set((state) => ({ shots: [...state.shots, ...shots] })),

  update: (id, patch) =>
    set((state) => ({
      shots: state.shots.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),

  remove: (id) =>
    set((state) => ({
      shots: state.shots.filter((s) => s.id !== id),
    })),

  setGenStatus: (id, status) =>
    set((state) => ({
      shots: state.shots.map((s) =>
        s.id === id ? { ...s, genStatus: status } : s
      ),
    })),

  setKeyframe: (id, url) =>
    set((state) => ({
      shots: state.shots.map((s) =>
        s.id === id ? { ...s, keyframeUrl: url, genStatus: '已生成' } : s
      ),
    })),

  setPrompt: (id, prompt) =>
    set((state) => ({
      shots: state.shots.map((s) => (s.id === id ? { ...s, prompt } : s)),
    })),

  getById: (id) => get().shots.find((s) => s.id === id),

  byEpisode: (episodeId) =>
    get().shots.filter((s) => s.episodeId === episodeId),

  getByNumber: (episodeId, number) =>
    get().shots.find(
      (s) => s.episodeId === episodeId && s.number === number
    ),
}));
