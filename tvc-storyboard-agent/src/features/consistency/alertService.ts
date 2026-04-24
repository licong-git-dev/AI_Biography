import type { Episode } from '../../types';
import { getGeminiClient, MODELS } from '../../services/geminiClient';
import { composeSystemPrompt } from '../../services/systemPrompt';
import { cleanJson } from '../../services/jsonUtils';
import { raceAbort } from '../../services/abort';
import { recordCall } from '../../stores/statsStore';
import type { AlertSeverity } from '../../stores/alertsStore';

export interface DownstreamAlertCandidate {
  affectedEpisodeId: string;
  severity: AlertSeverity;
  message: string;
}

const TASK_RULES = `你现在的工作是"联动警报官"。用户刚改了一集的钩子/高潮/悬念。
请判断：这次改动会不会让它的**后续集**出现不协调（伏笔断裂、情绪
曲线错位、角色动机突变等）。

- 只关注被改集 **之后** 的集（episodeNumber 更大）
- 只报会真正受影响的集，不要凡是沾边就报
- severity：critical=必须改 / warning=建议改 / info=注意即可
- 如果没影响就返回 alerts: []`;

function buildPrompt(changed: Episode, downstream: Episode[]): string {
  const changedBlock = `【刚改过的集】
EP${String(changed.episodeNumber).padStart(2, '0')}《${changed.title}》
- 冲突：${changed.mainConflict}
- 钩子：${changed.hook ?? '—'}
- 高潮：${changed.climax ?? '—'}
- 悬念：${changed.suspense ?? '—'}
- 记忆点：${changed.memoryPoints.join('、')}`;

  const downstreamBlock = downstream
    .map(
      (e) => `EP${String(e.episodeNumber).padStart(2, '0')}《${e.title}》 [id:${e.id}]
  冲突：${e.mainConflict}
  钩子：${e.hook ?? '—'}
  高潮：${e.climax ?? '—'}
  悬念：${e.suspense ?? '—'}`
    )
    .join('\n\n');

  return `${changedBlock}

【后续集（按顺序）】
${downstreamBlock}

【输出 - 严格 JSON】
{
  "alerts": [
    {
      "affectedEpisodeId": "后续集的 id（从上面 [id:xxx] 复制）",
      "severity": "critical | warning | info",
      "message": "为什么需要联动调整（简短一句）"
    }
  ]
}

只返回 JSON。若无影响，alerts: []`;
}

export async function detectDownstreamAlerts(params: {
  changed: Episode;
  downstream: Episode[];
  signal?: AbortSignal;
}): Promise<DownstreamAlertCandidate[]> {
  const { changed, downstream, signal } = params;
  if (downstream.length === 0) return [];

  const ai = getGeminiClient();
  const prompt = buildPrompt(changed, downstream);

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
  if (!text) return [];

  let parsed: { alerts?: DownstreamAlertCandidate[] };
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch {
    return [];
  }

  return Array.isArray(parsed.alerts) ? parsed.alerts : [];
}
