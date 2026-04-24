import { create } from 'zustand';

export type AICallKind =
  | 'text'
  | 'image'
  | 'video'
  | 'tts'
  | 'stt'
  | 'chat-stream';

interface StatsStore {
  byKind: Record<AICallKind, number>;
  total: number;
  lastCallAt: number | null;
  sessionStart: number;

  record: (kind: AICallKind) => void;
  reset: () => void;
}

const ZERO: Record<AICallKind, number> = {
  text: 0,
  image: 0,
  video: 0,
  tts: 0,
  stt: 0,
  'chat-stream': 0,
};

export const useStatsStore = create<StatsStore>((set) => ({
  byKind: { ...ZERO },
  total: 0,
  lastCallAt: null,
  sessionStart: Date.now(),

  record: (kind) =>
    set((s) => ({
      byKind: { ...s.byKind, [kind]: s.byKind[kind] + 1 },
      total: s.total + 1,
      lastCallAt: Date.now(),
    })),

  reset: () =>
    set({
      byKind: { ...ZERO },
      total: 0,
      lastCallAt: null,
      sessionStart: Date.now(),
    }),
}));

/** 便捷包装：调用前 record 一次 */
export function recordCall(kind: AICallKind): void {
  useStatsStore.getState().record(kind);
}
