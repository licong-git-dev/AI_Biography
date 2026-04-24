import type { Episode, EpisodeMetric } from '../../types';

/**
 * 把已录入的发布数据汇总成 AI 上下文。只包含有数据的集。
 * 调用方（hookService / publishingService 等）在 buildPrompt 时前置注入。
 */
export function buildPriorMetricsContext(episodes: Episode[]): string | null {
  const rows: string[] = [];

  for (const ep of episodes) {
    const metrics = ep.metrics ?? [];
    if (metrics.length === 0) continue;

    for (const m of metrics) {
      const parts: string[] = [];
      if (m.completionRate !== undefined)
        parts.push(`完播 ${m.completionRate}%`);
      if (m.likes !== undefined) parts.push(`赞 ${formatNum(m.likes)}`);
      if (m.comments !== undefined) parts.push(`评 ${formatNum(m.comments)}`);
      if (m.shares !== undefined) parts.push(`转 ${formatNum(m.shares)}`);
      if (m.views !== undefined) parts.push(`看 ${formatNum(m.views)}`);
      if (parts.length === 0 && !m.notes) continue;

      const tail = m.notes ? ` · 笔记：${m.notes}` : '';
      rows.push(
        `- EP${String(ep.episodeNumber).padStart(2, '0')}《${ep.title}》@${m.platform}：${parts.join(' / ')}${tail}`
      );
    }
  }

  if (rows.length === 0) return null;

  return `【前面几集已发布的真实数据（作参考，不要硬抄，找规律）】\n${rows.join('\n')}`;
}

function formatNum(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}千`;
  return String(n);
}

export function avgCompletion(metrics?: EpisodeMetric[]): number | null {
  const arr = (metrics ?? []).filter((m) => m.completionRate !== undefined);
  if (arr.length === 0) return null;
  return Math.round(
    arr.reduce((a, m) => a + (m.completionRate ?? 0), 0) / arr.length
  );
}
