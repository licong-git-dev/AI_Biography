import type { Chapter } from '../../types';
import {
  getGeminiClient,
  MODELS,
  thinkingConfigIfEnabled,
} from '../../services/geminiClient';
import { composeSystemPrompt } from '../../services/systemPrompt';
import { cleanJson } from '../../services/jsonUtils';
import { raceAbort } from '../../services/abort';
import { recordCall } from '../../stores/statsStore';

export type EmotionTone =
  | '温暖'
  | '怀旧'
  | '心酸'
  | '紧张'
  | '欢快'
  | '失落'
  | '愤怒'
  | '希望'
  | '迷茫'
  | '高潮'
  | '平静';

export interface EmotionPoint {
  /** 0-1 之间，表示该段落在整章中的相对位置 */
  position: number;
  /** 1-10，情绪强度 */
  intensity: number;
  tone: EmotionTone;
  snippet: string; // 代表性句子（≤30 字）
  hookCandidate: boolean; // AI 判断是否适合做钩子
}

const TASK_RULES = `你现在的工作是"情绪曲线分析师"——把一章原文按段切片，标出每段的情绪
强度和基调。

原则：
- 8-12 个采样点，覆盖整章
- intensity 1-10 反映该段落情绪强烈程度（描述性段落低分，情感冲突
  / 高潮 / 反转点高分）
- tone 必须从给定枚举里选
- snippet 是该段落里最能代表情绪的一句话或半句话（≤30 字）
- hookCandidate=true 仅给最有钩子潜力的 1-3 个点，要满足"3 秒能讲
  清楚情绪 + 有画面感"`;

const TONES: EmotionTone[] = [
  '温暖',
  '怀旧',
  '心酸',
  '紧张',
  '欢快',
  '失落',
  '愤怒',
  '希望',
  '迷茫',
  '高潮',
  '平静',
];

function buildPrompt(chapter: Chapter, count: number): string {
  return `分析下面这一章的情绪曲线。

【章节】第 ${chapter.number} 章《${chapter.title}》（${chapter.wordCount} 字）

【正文】
${chapter.content}

【输出 — 严格 JSON】
{
  "points": [
    {
      "position": 0.0 到 1.0 之间（相对于全章的位置）,
      "intensity": 1-10,
      "tone": "${TONES.join(' | ')}",
      "snippet": "代表性句子（≤30 字）",
      "hookCandidate": true | false
    }
  ]
}

硬性要求：
1. points 数组按 position 升序，包含 ${count} 个采样点
2. position 必须从 0.0 到接近 1.0 均匀覆盖
3. tone 必须从给定枚举选
4. hookCandidate 只给 1-3 个最适合的（不是越多越好）
5. 只返回 JSON`;
}

export async function analyzeChapterEmotionArc(
  chapter: Chapter,
  count: number = 10,
  signal?: AbortSignal
): Promise<EmotionPoint[]> {
  const ai = getGeminiClient();
  const prompt = buildPrompt(chapter, count);

  recordCall('text');
  const response = await raceAbort(
    ai.models.generateContent({
      model: MODELS.TEXT,
      contents: prompt,
      config: {
        systemInstruction: composeSystemPrompt(TASK_RULES),
        responseMimeType: 'application/json',
        ...thinkingConfigIfEnabled(),
      },
    }),
    signal
  );

  const text = response.text ?? '';
  if (!text) throw new Error('Gemini 返回为空。');

  let parsed: { points?: EmotionPoint[] };
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch (e) {
    throw new Error(
      `无法解析 Gemini 返回的 JSON：${e instanceof Error ? e.message : String(e)}`
    );
  }

  const points = parsed.points;
  if (!Array.isArray(points) || points.length === 0) {
    throw new Error('返回里没有 points 数组。');
  }
  return points
    .filter((p) => typeof p.position === 'number')
    .sort((a, b) => a.position - b.position);
}

export const TONE_COLOR: Record<EmotionTone, string> = {
  温暖: '#fbbf24',
  怀旧: '#d97706',
  心酸: '#9ca3af',
  紧张: '#dc2626',
  欢快: '#22c55e',
  失落: '#475569',
  愤怒: '#b91c1c',
  希望: '#06b6d4',
  迷茫: '#6b7280',
  高潮: '#a855f7',
  平静: '#64748b',
};
