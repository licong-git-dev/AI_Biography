import type { Character, Episode, Shot } from '../../types';
import { getGeminiClient, MODELS } from '../../services/geminiClient';
import { composeSystemPrompt } from '../../services/systemPrompt';
import { cleanJson } from '../../services/jsonUtils';
import { raceAbort } from '../../services/abort';
import { recordCall } from '../../stores/statsStore';

export type IssueSeverity = 'high' | 'medium' | 'low';

export interface ConsistencyIssue {
  severity: IssueSeverity;
  category:
    | '角色矛盾'
    | '时间线'
    | '伏笔失衡'
    | '情绪曲线'
    | '节奏';
  description: string;
  affectedEpisodes: string[]; // episodeNumber (如 "EP01")
  suggestion?: string;
}

const TASK_RULES = `你现在的工作是"跨集一致性检查官"——审阅一整季的集数规划和镜头表，
找出下列类型的矛盾或失衡：

1. 角色矛盾：同一角色在不同集表现出互相违和的性格/动机/能力/外观
2. 时间线：事件发生先后与年龄/情节逻辑冲突
3. 伏笔失衡：某集埋的伏笔后续没呼应；或结论没有前文铺垫
4. 情绪曲线：整季起伏过平或过激，缺乏节奏感
5. 节奏：集与集之间节奏雷同、钩子风格重复过多

要诚实。如果没有问题就返回 issues: []。如果发现问题，每条写清楚：
- severity: high/medium/low
- category: 上述 5 类之一
- affectedEpisodes: ["EP01", "EP03"] 这种字符串数组
- description: 具体是什么问题，一句话
- suggestion: 如何修，一句话`;

function buildPrompt(
  episodes: Episode[],
  characters: Character[],
  shots: Shot[]
): string {
  const episodeLines = episodes
    .sort(
      (a, b) =>
        a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber
    )
    .map((e) => {
      const shotCount = shots.filter((s) => s.episodeId === e.id).length;
      return `EP${String(e.episodeNumber).padStart(2, '0')}《${e.title}》[${e.priority}·${e.status}] ${e.targetDuration}
  冲突：${e.mainConflict}
  钩子：${e.hook ?? '—'}
  高潮：${e.climax ?? '—'}
  悬念：${e.suspense ?? '—'}
  记忆点：${e.memoryPoints.join('、')}
  来源章：第 ${e.sourceChapters.join('、')} 章
  镜头数：${shotCount}`;
    })
    .join('\n\n');

  const charLines = characters
    .map(
      (c) =>
        `- ${c.name}（${c.group}·${c.ageStage}·${c.ageRange}）：${c.vibe.join('、')}`
    )
    .join('\n');

  return `【全季集数】
${episodeLines}

【出场角色池】
${charLines}

【输出 — 严格 JSON】
{
  "issues": [
    {
      "severity": "high | medium | low",
      "category": "角色矛盾 | 时间线 | 伏笔失衡 | 情绪曲线 | 节奏",
      "description": "...",
      "affectedEpisodes": ["EP01", "EP03"],
      "suggestion": "..."
    }
  ]
}

只返回 JSON。`;
}

export async function checkSeasonConsistency(params: {
  episodes: Episode[];
  characters: Character[];
  shots: Shot[];
  signal?: AbortSignal;
}): Promise<ConsistencyIssue[]> {
  const { episodes, characters, shots, signal } = params;
  if (episodes.length === 0) return [];

  const ai = getGeminiClient();
  const prompt = buildPrompt(episodes, characters, shots);

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

  let parsed: { issues?: ConsistencyIssue[] };
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch (e) {
    throw new Error(
      `无法解析返回的 JSON：${e instanceof Error ? e.message : String(e)}`
    );
  }

  return Array.isArray(parsed.issues) ? parsed.issues : [];
}
