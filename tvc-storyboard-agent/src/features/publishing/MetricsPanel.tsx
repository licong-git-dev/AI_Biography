import React, { useState } from 'react';
import { BarChart3, Plus, Trash2 } from 'lucide-react';
import type { Episode, EpisodeMetric, Platform } from '../../types';
import { PLATFORMS } from '../../types';
import { useEpisodeStore } from '../../stores';
import { toast } from '../../stores/toastStore';

interface Props {
  episode: Episode;
}

const MetricsPanel: React.FC<Props> = ({ episode }) => {
  const update = useEpisodeStore((s) => s.update);
  const metrics = episode.metrics ?? [];
  const [open, setOpen] = useState(metrics.length > 0);

  const setMetric = (idx: number, patch: Partial<EpisodeMetric>) => {
    const next = [...metrics];
    const current = next[idx] ?? { platform: '抖音' as Platform };
    next[idx] = { ...current, ...patch } as EpisodeMetric;
    update(episode.id, { metrics: next });
  };

  const addMetric = () => {
    const existingPlatforms = new Set(metrics.map((m) => m.platform));
    const nextPlatform =
      PLATFORMS.find((p) => !existingPlatforms.has(p)) ?? '抖音';
    update(episode.id, {
      metrics: [...metrics, { platform: nextPlatform }],
    });
    setOpen(true);
  };

  const removeMetric = (idx: number) => {
    const next = metrics.filter((_, i) => i !== idx);
    update(episode.id, { metrics: next });
    if (next.length === 0) {
      toast.info('本集发布数据已清空');
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/30 p-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
        type="button"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-200">
          <BarChart3 size={12} /> 发布数据
          {metrics.length > 0 && (
            <span className="text-[10px] text-neutral-500">
              {metrics.length} 个平台
            </span>
          )}
        </span>
        <span className="text-[10px] text-neutral-500">
          {open ? '收起' : '展开'}
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {metrics.length === 0 && (
            <div className="text-[11px] text-neutral-500">
              录入后，下一集的钩子生成 / 平台文案会参考这些真实数据。
            </div>
          )}
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className="rounded border border-neutral-800 bg-neutral-900/60 p-2"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <select
                  value={m.platform}
                  onChange={(e) =>
                    setMetric(idx, { platform: e.target.value as Platform })
                  }
                  className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-[11px] text-neutral-100"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeMetric(idx)}
                  className="rounded p-1 text-neutral-500 hover:bg-red-950/40 hover:text-red-400"
                  type="button"
                  title="删除本行"
                >
                  <Trash2 size={10} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                <NumField
                  label="完播%"
                  value={m.completionRate}
                  onChange={(v) => setMetric(idx, { completionRate: v })}
                />
                <NumField
                  label="点赞"
                  value={m.likes}
                  onChange={(v) => setMetric(idx, { likes: v })}
                />
                <NumField
                  label="评论"
                  value={m.comments}
                  onChange={(v) => setMetric(idx, { comments: v })}
                />
                <NumField
                  label="转发"
                  value={m.shares}
                  onChange={(v) => setMetric(idx, { shares: v })}
                />
                <NumField
                  label="播放"
                  value={m.views}
                  onChange={(v) => setMetric(idx, { views: v })}
                />
              </div>
              <input
                type="text"
                value={m.notes ?? ''}
                onChange={(e) => setMetric(idx, { notes: e.target.value })}
                placeholder="评论区关键词 / 爆款要素（会注入到下一集 AI 上下文）"
                className="mt-1.5 w-full rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-200 placeholder:text-neutral-600"
              />
            </div>
          ))}

          <button
            onClick={addMetric}
            disabled={metrics.length >= PLATFORMS.length}
            className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-neutral-700 bg-neutral-900/40 py-1 text-[11px] text-neutral-400 hover:border-neutral-600 hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
          >
            <Plus size={10} />{' '}
            {metrics.length >= PLATFORMS.length ? '已覆盖全部 4 个平台' : '加一行平台数据'}
          </button>
        </div>
      )}
    </div>
  );
};

const NumField: React.FC<{
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <div className="text-[9px] uppercase tracking-wide text-neutral-600">
      {label}
    </div>
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') return onChange(undefined);
        const n = parseFloat(raw);
        onChange(Number.isFinite(n) ? n : undefined);
      }}
      className="mt-0.5 w-full rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-[11px] text-neutral-100 focus:border-neutral-600 focus:outline-none"
      min={0}
    />
  </div>
);

export default MetricsPanel;
