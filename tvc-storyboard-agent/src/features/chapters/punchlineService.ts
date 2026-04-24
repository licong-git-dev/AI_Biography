import type { Chapter } from '../../types';
import { getGeminiClient, MODELS } from '../../services/geminiClient';
import { composeSystemPrompt } from '../../services/systemPrompt';
import { cleanJson } from '../../services/jsonUtils';
import { raceAbort } from '../../services/abort';
import { recordCall } from '../../stores/statsStore';

export interface PunchlineCandidate {
  text: string;
  mood: '怀旧' | '心酸' | '温暖' | '反转' | '金句宣告' | '自嘲' | '爆点';
  why: string; // 为什么能打
  contextHint: string; // 原文附近 10-30 字上下文，帮助定位
}

const TASK_RULES = `你现在的工作是"金句提取官"——从章节原文里挑出最有传播力的句子，
做成短视频的字幕卡点、置顶评论、封面文案候选。

原则：
- 只挑原文中实际出现或非常接近原文的句子（不许自创）
- 长度 8-25 字最合适；过长的可以精简，但要保留原味
- 每句附一个 mood 标签 + 为什么能打的一句话 + 附近 10-30 字上下文
- 6-10 条候选，风格要混（怀旧 / 心酸 / 温暖 / 反转 / 金句宣告 / 自嘲 / 爆点）
- 若章节里实在没有好句子就返回少几条或空数组`;

function buildPrompt(chapter: Chapter, targetCount: number): string {
  return `从下面这一章里挑出 ${targetCount} 条金句候选。

【章节】第 ${chapter.number} 章《${chapter.title}》（${chapter.wordCount} 字）

【章节正文】
${chapter.content}

【输出 — 严格 JSON】
{
  "candidates": [
    {
      "text": "金句本身（≤25 字）",
      "mood": "怀旧 | 心酸 | 温暖 | 反转 | 金句宣告 | 自嘲 | 爆点",
      "why": "为什么这句能抓人（一句话）",
      "contextHint": "原文附近的上下文 10-30 字，帮助用户定位"
    }
  ]
}

只返回 JSON。`;
}

export async function extractPunchlines(
  chapter: Chapter,
  targetCount: number = 8,
  signal?: AbortSignal
): Promise<PunchlineCandidate[]> {
  const ai = getGeminiClient();
  const prompt = buildPrompt(chapter, targetCount);

  recordCall('text');
  const response = await raceAbort(
    ai.models.generateContent({
      model: MODELS.TEXT,
      contents: prompt,
      config: {
        systemInstruction: composeSystemPrompt(TASK_RULES),
        responseMimeType: 'application/json',
      },
    }),
    signal
  );

  const text = response.text ?? '';
  if (!text) throw new Error('Gemini 返回为空。');

  let parsed: { candidates?: PunchlineCandidate[] };
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch (e) {
    throw new Error(
      `无法解析返回的 JSON：${e instanceof Error ? e.message : String(e)}`
    );
  }

  return Array.isArray(parsed.candidates) ? parsed.candidates : [];
}
