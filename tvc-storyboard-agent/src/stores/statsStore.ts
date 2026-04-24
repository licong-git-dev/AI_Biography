import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AICallKind =
  | 'text'
  | 'image'
  | 'video'
  | 'tts'
  | 'stt'
  | 'chat-stream';

/**
 * 粗略单价（USD / 次）。实际账单以 Google Cloud Billing 为准。
 * 这里只是给用户一个量级感：
 * - text / chat-stream: 按平均 1k 输入 + 500 输出 tok 估算
 * - image (Nano Banana Pro): 按 $0.04/张
 * - video (Veo 3): 按 $0.40 保守估（生成 3-8s 视频）
 * - tts: 按平均 200 字估
 * - stt: 按 3-8s 音频估
 * 用户可在设置里修改。
 */
export const DEFAULT_PRICE_USD: Record<AICallKind, number> = {
  text: 0.008,
  'chat-stream': 0.008,
  image: 0.04,
  video: 0.4,
  tts: 0.002,
  stt: 0.002,
};

interface StatsStore {
  byKind: Record<AICallKind, number>;
  total: number;
  lastCallAt: number | null;
  sessionStart: number;
  /** 用户可覆盖的单价 */
  priceOverride: Partial<Record<AICallKind, number>>;

  record: (kind: AICallKind) => void;
  reset: () => void;
  setPrice: (kind: AICallKind, usd: number) => void;
  resetPrices: () => void;
}

const ZERO: Record<AICallKind, number> = {
  text: 0,
  image: 0,
  video: 0,
  tts: 0,
  stt: 0,
  'chat-stream': 0,
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      byKind: { ...ZERO },
      total: 0,
      lastCallAt: null,
      sessionStart: Date.now(),
      priceOverride: {},

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

      setPrice: (kind, usd) =>
        set((s) => ({
          priceOverride: { ...s.priceOverride, [kind]: usd },
        })),

      resetPrices: () => set({ priceOverride: {} }),
    }),
    {
      name: 'licong-stats',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // 调用计数不持久（session 级），但单价覆盖持久
      partialize: (s) => ({ priceOverride: s.priceOverride }),
    }
  )
);

/** 取某类调用的当前单价（overrides > default） */
export function getPrice(kind: AICallKind): number {
  const { priceOverride } = useStatsStore.getState();
  return priceOverride[kind] ?? DEFAULT_PRICE_USD[kind];
}

/** 估算本次会话累计花费 */
export function estimatedCostUSD(): number {
  const { byKind } = useStatsStore.getState();
  let total = 0;
  for (const kind of Object.keys(byKind) as AICallKind[]) {
    total += byKind[kind] * getPrice(kind);
  }
  return total;
}

/** 便捷包装：调用前 record 一次 */
export function recordCall(kind: AICallKind): void {
  useStatsStore.getState().record(kind);
}
