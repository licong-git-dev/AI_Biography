import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ModelKind } from '../services/geminiClient';

export type HealthStatus = 'unknown' | 'probing' | 'ok' | 'fail';

export interface ModelHealth {
  status: HealthStatus;
  /** 上次探测的错误信息（fail 时填） */
  lastError?: string;
  lastProbedAt?: number;
}

interface ModelStore {
  /** 用户覆盖的模型 ID，空字符串 = 用默认 */
  overrides: Partial<Record<ModelKind, string>>;
  /** 健康探测结果 */
  health: Partial<Record<ModelKind, ModelHealth>>;

  setOverride: (kind: ModelKind, value: string) => void;
  resetOverrides: () => void;

  setHealth: (kind: ModelKind, h: ModelHealth) => void;
  clearHealth: () => void;
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      overrides: {},
      health: {},

      setOverride: (kind, value) =>
        set((s) => ({
          overrides: { ...s.overrides, [kind]: value.trim() },
        })),

      resetOverrides: () => set({ overrides: {} }),

      setHealth: (kind, h) =>
        set((s) => ({ health: { ...s.health, [kind]: h } })),

      clearHealth: () => set({ health: {} }),
    }),
    {
      name: 'licong-models',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // health 不持久（每次会话重新探测）
      partialize: (s) => ({ overrides: s.overrides }),
    }
  )
);
