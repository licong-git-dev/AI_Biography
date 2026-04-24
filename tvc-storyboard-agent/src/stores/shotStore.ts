import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Shot, ShotGenStatus, VideoGenStatus, VoiceGenStatus } from '../types';
import { SEED_SHOTS } from '../data/samples';

interface ShotStore {
  shots: Shot[];
  activeId: string | null;

  setActive: (id: string | null) => void;
  add: (shot: Shot) => void;
  addMany: (shots: Shot[]) => void;
  update: (id: string, patch: Partial<Shot>) => void;
  remove: (id: string) => void;
  removeByEpisode: (episodeId: string) => void;
  moveShot: (id: string, direction: 'up' | 'down') => void;
  setGenStatus: (id: string, status: ShotGenStatus) => void;
  setKeyframe: (id: string, url: string) => void;
  setPrompt: (id: string, prompt: string) => void;
  setVideoGenStatus: (id: string, status: VideoGenStatus) => void;
  setVideo: (id: string, url: string, prompt: string) => void;
  setVoiceGenStatus: (id: string, status: VoiceGenStatus) => void;
  setVoice: (id: string, url: string, speaker: string) => void;
  resetToSeed: () => void;

  getById: (id: string) => Shot | undefined;
  byEpisode: (episodeId: string) => Shot[];
  getByNumber: (episodeId: string, number: string) => Shot | undefined;
}

export const useShotStore = create<ShotStore>()(
  persist(
    (set, get) => ({
      shots: SEED_SHOTS,
      activeId: null,

      setActive: (id) => set({ activeId: id }),

      add: (shot) => set((state) => ({ shots: [...state.shots, shot] })),

      addMany: (shots) =>
        set((state) => ({ shots: [...state.shots, ...shots] })),

      update: (id, patch) =>
        set((state) => ({
          shots: state.shots.map((s) => {
            if (s.id !== id) return s;
            const next: Shot = { ...s, ...patch };
            // 关键帧影响因子改动后，标记参考图为 stale（若已生成过）
            if (s.keyframeUrl) {
              const changedGenField =
                (patch.description !== undefined &&
                  patch.description !== s.description) ||
                (patch.shotSize !== undefined &&
                  patch.shotSize !== s.shotSize) ||
                (patch.cameraMove !== undefined &&
                  patch.cameraMove !== s.cameraMove) ||
                (patch.characters !== undefined &&
                  JSON.stringify(patch.characters) !==
                    JSON.stringify(s.characters));
              if (changedGenField) {
                next.keyframeStale = true;
              }
            }
            return next;
          }),
        })),

      remove: (id) =>
        set((state) => ({
          shots: state.shots.filter((s) => s.id !== id),
          activeId: state.activeId === id ? null : state.activeId,
        })),

      removeByEpisode: (episodeId) =>
        set((state) => ({
          shots: state.shots.filter((s) => s.episodeId !== episodeId),
        })),

      moveShot: (id, direction) =>
        set((state) => {
          const target = state.shots.find((s) => s.id === id);
          if (!target) return state;
          const sameEp = state.shots.filter(
            (s) => s.episodeId === target.episodeId
          );
          const idxInEp = sameEp.findIndex((s) => s.id === id);
          const swapIdx = direction === 'up' ? idxInEp - 1 : idxInEp + 1;
          if (swapIdx < 0 || swapIdx >= sameEp.length) return state;
          const neighbor = sameEp[swapIdx]!;

          // 在完整 shots 数组里交换 target 和 neighbor 的位置
          const targetAbs = state.shots.findIndex((s) => s.id === target.id);
          const neighborAbs = state.shots.findIndex(
            (s) => s.id === neighbor.id
          );
          const next = state.shots.slice();
          [next[targetAbs], next[neighborAbs]] = [
            next[neighborAbs]!,
            next[targetAbs]!,
          ];
          return { shots: next };
        }),

      setGenStatus: (id, status) =>
        set((state) => ({
          shots: state.shots.map((s) =>
            s.id === id ? { ...s, genStatus: status } : s
          ),
        })),

      setKeyframe: (id, url) =>
        set((state) => ({
          shots: state.shots.map((s) =>
            s.id === id
              ? { ...s, keyframeUrl: url, keyframeStale: false, genStatus: '已生成' }
              : s
          ),
        })),

      setPrompt: (id, prompt) =>
        set((state) => ({
          shots: state.shots.map((s) =>
            s.id === id ? { ...s, prompt } : s
          ),
        })),

      setVideoGenStatus: (id, status) =>
        set((state) => ({
          shots: state.shots.map((s) =>
            s.id === id ? { ...s, videoGenStatus: status } : s
          ),
        })),

      setVideo: (id, url, prompt) =>
        set((state) => ({
          shots: state.shots.map((s) =>
            s.id === id
              ? { ...s, videoUrl: url, videoPrompt: prompt, videoGenStatus: '已生成' }
              : s
          ),
        })),

      setVoiceGenStatus: (id, status) =>
        set((state) => ({
          shots: state.shots.map((s) =>
            s.id === id ? { ...s, voiceGenStatus: status } : s
          ),
        })),

      setVoice: (id, url, speaker) =>
        set((state) => ({
          shots: state.shots.map((s) =>
            s.id === id
              ? { ...s, voiceUrl: url, voiceSpeaker: speaker, voiceGenStatus: '已生成' }
              : s
          ),
        })),

      resetToSeed: () => set({ shots: SEED_SHOTS, activeId: null }),

      getById: (id) => get().shots.find((s) => s.id === id),

      byEpisode: (episodeId) =>
        get().shots.filter((s) => s.episodeId === episodeId),

      getByNumber: (episodeId, number) =>
        get().shots.find(
          (s) => s.episodeId === episodeId && s.number === number
        ),
    }),
    {
      name: 'licong-shots',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ shots: state.shots }),
    }
  )
);
