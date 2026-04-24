import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type FeedbackKind =
  | 'hook'
  | 'episode_split'
  | 'shot_list'
  | 'publishing'
  | 'cover_image'
  | 'punchline'
  | 'keyframe'
  | 'video'
  | 'voice';

export type FeedbackVerdict = 'up' | 'down' | 'adopted' | 'rejected';

export interface FeedbackEntry {
  id: string;
  kind: FeedbackKind;
  verdict: FeedbackVerdict;
  /** AI 输出的原文或摘要（保留一行给 prompt 上下文用） */
  sample: string;
  /** 用户可选的笔记："太长了" / "角色不对" */
  note?: string;
  /** 关联到哪个资源 */
  sourceEpisodeId?: string;
  sourceShotId?: string;
  createdAt: number;
}

interface FeedbackStore {
  entries: FeedbackEntry[];
  add: (e: Omit<FeedbackEntry, 'id' | 'createdAt'>) => void;
  remove: (id: string) => void;
  clearByKind: (kind: FeedbackKind) => void;
  byKind: (kind: FeedbackKind) => FeedbackEntry[];
}

export const useFeedbackStore = create<FeedbackStore>()(
  persist(
    (set, get) => ({
      entries: [],

      add: (e) =>
        set((s) => ({
          entries: [
            ...s.entries,
            {
              ...e,
              id: `fb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: Date.now(),
            },
          ],
        })),

      remove: (id) =>
        set((s) => ({ entries: s.entries.filter((x) => x.id !== id) })),

      clearByKind: (kind) =>
        set((s) => ({ entries: s.entries.filter((x) => x.kind !== kind) })),

      byKind: (kind) => get().entries.filter((x) => x.kind === kind),
    }),
    {
      name: 'licong-feedback',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ entries: s.entries }),
    }
  )
);

/** 把反馈汇总成 prompt 片段。常用在 hookService / episodeService 等 */
export function buildFeedbackContext(kind: FeedbackKind): string | null {
  const { entries } = useFeedbackStore.getState();
  const list = entries.filter((e) => e.kind === kind);
  if (list.length === 0) return null;

  const adopted = list.filter(
    (e) => e.verdict === 'up' || e.verdict === 'adopted'
  );
  const rejected = list.filter(
    (e) => e.verdict === 'down' || e.verdict === 'rejected'
  );

  const lines: string[] = [];
  if (adopted.length > 0) {
    lines.push('【用户以前偏好的输出（参考方向）】');
    for (const a of adopted.slice(-6)) {
      lines.push(`- ${a.sample}${a.note ? ` · 笔记：${a.note}` : ''}`);
    }
  }
  if (rejected.length > 0) {
    lines.push('');
    lines.push('【用户以前不满意的输出（避开此类）】');
    for (const r of rejected.slice(-6)) {
      lines.push(`- ${r.sample}${r.note ? ` · 原因：${r.note}` : ''}`);
    }
  }
  return lines.length > 0 ? lines.join('\n') : null;
}
