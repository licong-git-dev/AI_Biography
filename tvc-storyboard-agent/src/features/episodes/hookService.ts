import type { Episode } from '../../types';
import { getGeminiClient, MODELS } from '../../services/geminiClient';
import { composeSystemPrompt } from '../../services/systemPrompt';
import { cleanJson } from '../../services/jsonUtils';
import { raceAbort } from '../../services/abort';
import { recordCall } from '../../stores/statsStore';

export interface HookCandidate {
  text: string;
  style: '视觉冲击' | '情绪共鸣' | '悬念设问' | '反差对比' | '金句宣告';
  why: string;
}

const TASK_RULES = `你现在的工作是"钩子工坊"——为一集短剧设计 3 秒抓人的开场钩子。

原则：
- 钩子 = 视频前 3 秒能抓住观众的画面或台词
- 必须具体可视化，不是抽象形容词
- 每一条钩子要对应一种明确的心理机制：视觉冲击 / 情绪共鸣 / 悬念设问 / 反差对比 / 金句宣告
- 给出 5 条候选，风格彼此不同，让用户对比挑选
- 每条附一句"为什么这个钩子有用"`;

function buildPrompt(episode: Episode, count: number): string {
  return `为下面这一集生成 ${count} 个不同风格的开场钩子候选。

【集信息】
EP${String(episode.episodeNumber).padStart(2, '0')}《${episode.title}》
- 主冲突：${episode.mainConflict}
${episode.hook ? `- 当前钩子：${episode.hook}（不要重复这一版，要给出新角度）` : ''}
${episode.climax ? `- 情绪高潮：${episode.climax}` : ''}
${episode.suspense ? `- 结尾悬念：${episode.suspense}` : ''}
- 记忆点：${episode.memoryPoints.join('、')}
- 平台卖点：${episode.platformSellingPoint}
- 目标时长：${episode.targetDuration}

【输出格式 — 严格 JSON】
{
  "candidates": [
    {
      "text": "钩子内容（一句话或一个画面描述）",
      "style": "视觉冲击 | 情绪共鸣 | 悬念设问 | 反差对比 | 金句宣告",
      "why": "为什么这个钩子能抓人（简短一句）"
    }
  ]
}

硬性要求：
1. candidates 数组必须有 ${count} 条
2. style 必须从给定的 5 种里选，尽量覆盖不同风格
3. text 要具体可视化，不要"很感人"这种空洞词
4. 只返回 JSON，不要 markdown 或解释`;
}

export async function generateHookCandidates(
  episode: Episode,
  count: number = 5,
  signal?: AbortSignal
): Promise<HookCandidate[]> {
  const ai = getGeminiClient();
  const prompt = buildPrompt(episode, count);

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

  let parsed: { candidates?: HookCandidate[] };
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch (e) {
    throw new Error(
      `无法解析返回的 JSON：${e instanceof Error ? e.message : String(e)}`
    );
  }

  const candidates = parsed.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('返回里没有 candidates 数组。');
  }

  return candidates;
}
