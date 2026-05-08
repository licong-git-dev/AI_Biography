import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface StyleBaseline {
  /** 画风：古风水墨 / 电影感写实 / 动画日漫 / 90 年代港片 ... */
  visualStyle: string;
  /** 色调：暖黄怀旧 / 冷蓝忧郁 / 高饱和明媚 ... */
  colorTone: string;
  /** 镜头语言：缓推 + 柔焦 / 硬切 + 大特写 / 手持纪录感 ... */
  cinematography: string;
  /** 时代背景：90 年代农村 / 千禧初城市 / 民国上海 ... */
  era: string;
  /** 服化道关键词（数组） */
  costumeKeywords: string[];
  /** 自由备注（其它跨镜头共享的画面约束） */
  notes: string;
}

export const EMPTY_STYLE_BASELINE: StyleBaseline = {
  visualStyle: '',
  colorTone: '',
  cinematography: '',
  era: '',
  costumeKeywords: [],
  notes: '',
};

interface StyleBaselineStore {
  baseline: StyleBaseline;
  update: (patch: Partial<StyleBaseline>) => void;
  reset: () => void;
}

export const useStyleBaselineStore = create<StyleBaselineStore>()(
  persist(
    (set) => ({
      baseline: { ...EMPTY_STYLE_BASELINE },
      update: (patch) =>
        set((s) => ({ baseline: { ...s.baseline, ...patch } })),
      reset: () => set({ baseline: { ...EMPTY_STYLE_BASELINE } }),
    }),
    {
      name: 'licong-style-baseline',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** 是否已配置（任一字段非空即视为已配置） */
export function isStyleBaselineConfigured(b: StyleBaseline): boolean {
  return Boolean(
    b.visualStyle ||
      b.colorTone ||
      b.cinematography ||
      b.era ||
      b.costumeKeywords.length > 0 ||
      b.notes
  );
}

/** 拼成 prompt 注入用的多行文本；空则返回 null */
export function buildStyleBaselineContext(b: StyleBaseline): string | null {
  if (!isStyleBaselineConfigured(b)) return null;
  const lines: string[] = ['[全片风格基线 — 所有镜头/出图/视频生成必须遵守]'];
  if (b.visualStyle) lines.push(`- 画风：${b.visualStyle}`);
  if (b.colorTone) lines.push(`- 色调：${b.colorTone}`);
  if (b.cinematography) lines.push(`- 镜头语言：${b.cinematography}`);
  if (b.era) lines.push(`- 时代背景：${b.era}`);
  if (b.costumeKeywords.length > 0)
    lines.push(`- 服化道关键词：${b.costumeKeywords.join('、')}`);
  if (b.notes) lines.push(`- 备注：${b.notes}`);
  return lines.join('\n');
}
