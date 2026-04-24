import type { Episode, Shot } from '../../types';
import { getGeminiClient, MODELS } from '../../services/geminiClient';
import { composeSystemPrompt } from '../../services/systemPrompt';
import { cleanJson } from '../../services/jsonUtils';
import { raceAbort } from '../../services/abort';
import { recordCall } from '../../stores/statsStore';

export type ComplianceSeverity = 'block' | 'warn' | 'info';

export type ComplianceCategory =
  | '平台敏感词'
  | '人物姓名'
  | '地名或机构'
  | '时事政治'
  | '版权风险'
  | '低俗 / 导向'
  | '平台算法偏好';

export interface ComplianceIssue {
  severity: ComplianceSeverity;
  category: ComplianceCategory;
  location: string; // 如 "EP01.hook" / "EP01.shot-A-03" / "EP01.抖音.title"
  snippet: string; // 命中的原文片段
  reason: string; // 为什么会有风险
  suggestion?: string; // 怎么改
}

const TASK_RULES = `你现在的工作是"中国短视频平台合规预检官"。审阅一集短剧将要发布的
全部文案，找出可能触发以下风险的内容：

1. 平台敏感词：抖音 / 视频号 / 小红书 / B站常见的限流或下架词汇
2. 人物姓名：可能引起真实人物对号入座或名誉问题
3. 地名或机构：具体真实地名 / 单位名 / 品牌名带来的风险
4. 时事政治：涉及政策 / 政治人物 / 敏感历史事件
5. 版权风险：引用他人作品、台词、歌词、画面构图
6. 低俗 / 导向：擦边、拜金、暴力美化、封建迷信等
7. 平台算法偏好：明显与平台分发逻辑冲突（比如长句子不卡点、没有开场 hook）

严重度：
- block：必须改，否则基本发不出去
- warn：建议改，有概率被限流
- info：算法优化建议

只报真实可能触发的问题，不要过度敏感。无问题返回 issues: []`;

function buildPrompt(ep: Episode, shots: Shot[]): string {
  const lines: string[] = [];
  lines.push(
    `【集】EP${String(ep.episodeNumber).padStart(2, '0')}《${ep.title}》`
  );
  lines.push(`主冲突：${ep.mainConflict}`);
  if (ep.hook) lines.push(`钩子：${ep.hook}`);
  if (ep.climax) lines.push(`高潮：${ep.climax}`);
  if (ep.suspense) lines.push(`悬念：${ep.suspense}`);
  lines.push(`记忆点：${ep.memoryPoints.join('、')}`);
  lines.push('');

  lines.push('【镜头画面 + 旁白 + 对白】');
  for (const s of shots) {
    lines.push(
      `${s.number}｜${s.shotSize}｜${s.description}${s.narration ? ` ｜旁白：${s.narration}` : ''}${s.dialogue ? ` ｜对白：${s.dialogue}` : ''}`
    );
  }

  if (ep.publishingPack) {
    lines.push('');
    lines.push('【平台发布文案】');
    for (const p of ep.publishingPack.platforms) {
      lines.push(
        `- ${p.platform}：标题「${p.title}」 · 简介：${p.description.slice(0, 80)} · 标签 ${p.tags.join(' ')} · 封面文案「${p.coverText}」${p.pinnedComment ? ` · 置顶评论：${p.pinnedComment}` : ''}`
      );
    }
  }

  return `${lines.join('\n')}

【输出 — 严格 JSON】
{
  "issues": [
    {
      "severity": "block | warn | info",
      "category": "平台敏感词 | 人物姓名 | 地名或机构 | 时事政治 | 版权风险 | 低俗 / 导向 | 平台算法偏好",
      "location": "EP01.hook 这种路径，告诉我是哪个字段",
      "snippet": "命中的原文片段（5-30 字）",
      "reason": "为什么有风险（一句话）",
      "suggestion": "如何改（可选）"
    }
  ]
}

只返回 JSON。无问题 issues: []`;
}

export async function checkEpisodeCompliance(params: {
  episode: Episode;
  shots: Shot[];
  signal?: AbortSignal;
}): Promise<ComplianceIssue[]> {
  const { episode, shots, signal } = params;

  const ai = getGeminiClient();
  const prompt = buildPrompt(episode, shots);

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

  let parsed: { issues?: ComplianceIssue[] };
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch {
    return [];
  }

  return Array.isArray(parsed.issues) ? parsed.issues : [];
}
