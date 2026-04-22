import React from 'react';
import {
  useCharacterStore,
  useChapterStore,
  useEpisodeStore,
  useShotStore,
} from '../stores';
import { SEASON_NAME, SEASON_CORE_EMOTIONS } from '../data/episodes';
import type { Priority } from '../types';

const PRIORITY_COLOR: Record<Priority, string> = {
  S: 'bg-red-900/40 text-red-300 border-red-800/50',
  A: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
  'A-': 'bg-amber-900/20 text-amber-400 border-amber-800/30',
  B: 'bg-neutral-800 text-neutral-400 border-neutral-700',
};

const CenterPanel: React.FC = () => {
  const episodes = useEpisodeStore((s) => s.episodes);
  const activeEpisodeId = useEpisodeStore((s) => s.activeId);
  const setActiveEpisode = useEpisodeStore((s) => s.setActive);

  const chapterCount = useChapterStore((s) => s.chapters.length);
  const characterCount = useCharacterStore((s) => s.characters.length);
  const shotCount = useShotStore((s) => s.shots.length);

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">{SEASON_NAME}</h1>
        <p className="text-sm text-neutral-400 mt-1">
          核心情绪：{SEASON_CORE_EMOTIONS.join(' · ')}
        </p>
      </header>

      <div className="mb-6 grid grid-cols-4 gap-3">
        <StatCard label="章节" value={chapterCount} unit="章" />
        <StatCard label="角色" value={characterCount} unit="个" />
        <StatCard label="集数" value={episodes.length} unit="集" />
        <StatCard label="镜头" value={shotCount} unit="条" />
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-200">
            第一季 · 主剧情集规划
          </h2>
          <span className="text-xs text-neutral-500">
            Phase 4 将加"拆集 / 编辑"操作
          </span>
        </div>

        <div className="space-y-2">
          {episodes.map((ep) => {
            const active = ep.id === activeEpisodeId;
            return (
              <button
                key={ep.id}
                onClick={() => setActiveEpisode(active ? null : ep.id)}
                className={`w-full text-left rounded-lg border p-3 transition ${
                  active
                    ? 'border-neutral-600 bg-neutral-900'
                    : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-neutral-500">
                        EP{String(ep.episodeNumber).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-medium text-neutral-100">
                        《{ep.title}》
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_COLOR[ep.priority]}`}
                      >
                        {ep.priority}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 mb-1">
                      {ep.mainConflict}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      来源：第 {ep.sourceChapters.join('、')} 章 · {ep.targetDuration} ·{' '}
                      {ep.platformSellingPoint}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                    {ep.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  unit: string;
}> = ({ label, value, unit }) => (
  <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
    <div className="text-[10px] uppercase tracking-wide text-neutral-500">
      {label}
    </div>
    <div className="mt-1 flex items-baseline gap-1">
      <span className="text-xl font-semibold text-neutral-100">{value}</span>
      <span className="text-xs text-neutral-500">{unit}</span>
    </div>
  </div>
);

export default CenterPanel;
