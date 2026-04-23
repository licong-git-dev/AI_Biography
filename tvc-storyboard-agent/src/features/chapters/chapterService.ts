import type { Chapter, Priority, EpisodeFormat } from '../../types';
import { getGeminiClient, MODELS } from '../../services/geminiClient';

export interface GeneratedEpisode {
  title: string;
  hook: string;
  mainConflict: string;
  climax: string;
  suspense: string;
  memoryPoints: string[];
  platformSellingPoint: string;
  priority: Priority;
  targetDuration: string;
  format: EpisodeFormat;
}

const SYSTEM_INSTRUCTION = `你是《李聪传》AI 短剧生产总控，一位同时懂内容策划、分镜设计、角色一致性、短视频包装和平台分发的制作人。

你的任务：把《李聪传》的书稿章节拆成适合短视频平台传播的短剧集。

核心原则：
- 优先交付可连续生产的 AI 漫剧/动态短剧
- 叙事要有钩子、推进、高潮、悬念
- 单集时长 60-90 秒（约 6-10 个镜头）
- 每集独立成立，但留有"看下一集"的悬念
- 记忆点必须是可视化的具体画面或动作，不是空洞形容词
- 平台卖点要贴近短视频受众（怀旧、家庭、成长、代入感、情绪浓度）`;

function cleanJson(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

function buildPrompt(chapter: Chapter, targetCount: number): string {
  return `把下面这一章拆成 ${targetCount} 集短剧集。

【章节信息】
第 ${chapter.number} 章《${chapter.title}》（共 ${chapter.wordCount} 字）

【章节正文】
${chapter.content}

【拆集要求】
1. 每集必须独立成立，有开头钩子（3 秒抓人）、中段推进、情绪高潮、结尾悬念
2. ${targetCount} 集要覆盖这一章的核心情绪线和关键事件，不要遗漏关键记忆点
3. 集之间形成连续追更感：上一集悬念引出下一集开场
4. 记忆点要具体、可视化（如"公交车窗外倒影"而不是"童年感"）

【输出格式 — 严格 JSON】
{
  "episodes": [
    {
      "title": "集标题（不带《》）",
      "hook": "开头 3 秒的钩子画面或动作，具体可视化",
      "mainConflict": "本集主冲突一句话",
      "climax": "情绪高潮点的具体画面或事件",
      "suspense": "结尾悬念，留住观众",
      "memoryPoints": ["可视化记忆点 1", "可视化记忆点 2", "可视化记忆点 3"],
      "platformSellingPoint": "平台传播卖点（如'强怀旧+家庭情绪'）",
      "priority": "S | A | A- | B（S 最高）",
      "targetDuration": "60-90 秒",
      "format": "A-主剧情"
    }
  ]
}

只返回 JSON，不要任何解释或 markdown 代码块。`;
}

export async function splitChapterIntoEpisodes(
  chapter: Chapter,
  targetCount: number = 3
): Promise<GeneratedEpisode[]> {
  const ai = getGeminiClient();
  const prompt = buildPrompt(chapter, targetCount);

  const response = await ai.models.generateContent({
    model: MODELS.TEXT,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text ?? '';
  if (!text) {
    throw new Error('Gemini 返回为空，可能被安全策略拦截。');
  }

  let parsed: { episodes?: GeneratedEpisode[] };
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch (e) {
    throw new Error(
      `无法解析 Gemini 返回的 JSON：${e instanceof Error ? e.message : String(e)}`
    );
  }

  const episodes = parsed.episodes;
  if (!Array.isArray(episodes) || episodes.length === 0) {
    throw new Error('返回里没有 episodes 数组。');
  }

  return episodes;
}
