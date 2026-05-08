import type { Chapter, Priority, EpisodeFormat } from '../../types';
import {
  getGeminiClient,
  MODELS,
  thinkingConfigIfEnabled,
} from '../../services/geminiClient';
import { composeSystemPrompt } from '../../services/systemPrompt';
import { cleanJson } from '../../services/jsonUtils';
import { recordCall } from '../../stores/statsStore';
import { validateEpisodeProposals } from '../../services/validate';

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

const TASK_RULES = `你现在的工作是"章节拆集"——把《李聪传》书稿章节拆成适合短视频平台传播的短剧集。

额外规则：
- 叙事要有钩子、推进、高潮、悬念四段结构
- 单集时长 60-90 秒（约 6-10 个镜头）
- 每集独立成立，但留有"看下一集"的悬念
- 记忆点必须是可视化的具体画面或动作，不是空洞形容词
- 平台卖点要贴近短视频受众（怀旧、家庭、成长、代入感、情绪浓度）`;

/**
 * 内容矩阵 — 4 种格式各自的差异化指引。
 * 同一章可同时跑这 4 个 prompt 得到 4 套互补的剧集结构。
 */
const FORMAT_DIRECTIVES: Record<EpisodeFormat, string> = {
  'A-主剧情': `重点：完整叙事弧。每集 60-90 秒，钩子→推进→高潮→悬念四段齐整。
适合做主线连载，受众是想"追剧"的观众。`,
  'B-爆点切片': `重点：纯爆点切片。每集 15-30 秒，砍掉铺垫，开场即高潮或冲突，结尾留强悬念。
适合抖音/视频号信息流的"先抓住再说"，受众滑动到 1 秒内必须留住。`,
  'C-人物支线': `重点：单一角色视角。每集围绕一个角色（爷爷 / 奶奶 / 母亲 / 张珂等）的内心世界展开。
适合做人物专题、招商样片，受众想"看懂人"。如果章节没有该角色，可基于章节情境合理外推。`,
  'D-金句旁白': `重点：金句驱动 + 慢节奏旁白。每集围绕一句"截图金句"展开，画面跟着旁白走，少对白多意境。
适合小红书/视频号的"情绪共鸣"分发，受众是被一句话戳到然后看完的。`,
};

function buildPrompt(
  chapter: Chapter,
  targetCount: number,
  format: EpisodeFormat = 'A-主剧情'
): string {
  return `把下面这一章拆成 ${targetCount} 集短剧集。

【内容格式：${format}】
${FORMAT_DIRECTIVES[format]}

【章节信息】
第 ${chapter.number} 章《${chapter.title}》（共 ${chapter.wordCount} 字）

【章节正文】
${chapter.content}

【拆集要求】
1. 严格按上面"${format}"的指引来拆集，不要混入其它格式的特征
2. 每集必须独立成立
3. ${targetCount} 集覆盖这一章的核心情绪线和关键事件
4. 记忆点要具体、可视化（如"公交车窗外倒影"而不是"童年感"）
5. 输出的每集 format 字段必须是 "${format}"

【输出格式 — 严格 JSON】
{
  "episodes": [
    {
      "title": "集标题（不带《》）",
      "hook": "开头钩子画面或动作，具体可视化",
      "mainConflict": "本集主冲突一句话",
      "climax": "情绪高潮点的具体画面或事件",
      "suspense": "结尾悬念，留住观众",
      "memoryPoints": ["可视化记忆点 1", "可视化记忆点 2", "可视化记忆点 3"],
      "platformSellingPoint": "平台传播卖点",
      "priority": "S | A | A- | B（S 最高）",
      "targetDuration": "${format === 'B-爆点切片' ? '15-30 秒' : '60-90 秒'}",
      "format": "${format}"
    }
  ]
}

只返回 JSON，不要任何解释或 markdown 代码块。`;
}

export async function splitChapterIntoEpisodes(
  chapter: Chapter,
  targetCount: number = 3,
  format: EpisodeFormat = 'A-主剧情'
): Promise<GeneratedEpisode[]> {
  const ai = getGeminiClient();
  const prompt = buildPrompt(chapter, targetCount, format);

  recordCall('text');
  const response = await ai.models.generateContent({
    model: MODELS.TEXT,
    contents: prompt,
    config: {
      systemInstruction: composeSystemPrompt(TASK_RULES),
      responseMimeType: 'application/json',
      ...thinkingConfigIfEnabled(),
    },
  });

  const text = response.text ?? '';
  if (!text) {
    throw new Error('Gemini 返回为空，可能被安全策略拦截。');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch (e) {
    throw new Error(
      `无法解析 Gemini 返回的 JSON：${e instanceof Error ? e.message : String(e)}`
    );
  }

  // 强制把 format 字段统一回当前请求格式（防止模型回退）
  const proposals = validateEpisodeProposals(parsed);
  return proposals.map((p) => ({ ...p, format }));
}

export interface ContentMatrixItem {
  format: EpisodeFormat;
  episodes: GeneratedEpisode[];
  error?: string;
}

/**
 * 内容矩阵 — 同一章并行生成 4 种格式的剧集。
 * 任一格式失败不阻塞其它，error 字段标记失败原因。
 */
export async function generateContentMatrix(
  chapter: Chapter,
  targetCountPerFormat: number = 3,
  formats: EpisodeFormat[] = [
    'A-主剧情',
    'B-爆点切片',
    'C-人物支线',
    'D-金句旁白',
  ],
  signal?: AbortSignal
): Promise<ContentMatrixItem[]> {
  const tasks = formats.map(async (format): Promise<ContentMatrixItem> => {
    if (signal?.aborted) {
      return { format, episodes: [], error: '已取消' };
    }
    try {
      const episodes = await splitChapterIntoEpisodes(
        chapter,
        targetCountPerFormat,
        format
      );
      return { format, episodes };
    } catch (e) {
      return {
        format,
        episodes: [],
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });
  return Promise.all(tasks);
}

/**
 * 批量拆集：顺序处理多章。每章一次调用，中间可中止。
 * onStart/onSuccess/onFailure 让 UI 能实时显示进度。
 */
export async function splitManyChapters(params: {
  chapters: Chapter[];
  targetPerChapter: number;
  onStart: (chapterId: string) => void;
  onSuccess: (chapterId: string, episodes: GeneratedEpisode[]) => void;
  onFailure: (chapterId: string, error: string) => void;
  signal?: AbortSignal;
}): Promise<{ successCount: number; failCount: number; aborted: boolean }> {
  const { chapters, targetPerChapter, onStart, onSuccess, onFailure, signal } =
    params;
  let successCount = 0;
  let failCount = 0;
  for (const chapter of chapters) {
    if (signal?.aborted) return { successCount, failCount, aborted: true };
    onStart(chapter.id);
    try {
      const episodes = await splitChapterIntoEpisodes(chapter, targetPerChapter);
      onSuccess(chapter.id, episodes);
      successCount++;
    } catch (e) {
      if (signal?.aborted) return { successCount, failCount, aborted: true };
      const msg = e instanceof Error ? e.message : String(e);
      onFailure(chapter.id, msg);
      failCount++;
    }
  }
  return { successCount, failCount, aborted: false };
}
