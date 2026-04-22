import React from 'react';
import { useEpisodeStore } from '../../stores';
import type { Priority } from '../../types';

const PRIORITY_COLOR: Record<Priority, string> = {
  S: 'bg-red-900/40 text-red-300 border-red-800/50',
  A: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
  'A-': 'bg-amber-900/20 text-amber-400 border-amber-800/30',
  B: 'bg-neutral-800 text-neutral-400 border-neutral-700',
};

const EpisodeList: React.FC = () => {
  const episodes = useEpisodeStore((s) => s.episodes);
  const activeId = useEpisodeStore((s) => s.activeId);
  const setActive = useEpisodeStore((s) => s.setActive);

  return (
    <div className="space-y-2">
      {episodes.map((ep) => {
        const active = ep.id === activeId;
        return (
          <button
            key={ep.id}
            onClick={() => setActive(active ? null : ep.id)}
            className={`w-full text-left rounded-lg border p-3 transition ${
              active
                ? 'border-neutral-600 bg-neutral-900'
                : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-500">
                    EP{String(ep.episodeNumber).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-medium text-neutral-100">
                    《{ep.title}》
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] ${PRIORITY_COLOR[ep.priority]}`}
                  >
                    {ep.priority}
                  </span>
                </div>
                <div className="mb-1 text-xs text-neutral-400">
                  {ep.mainConflict}
                </div>
                <div className="text-[11px] text-neutral-500">
                  来源：第 {ep.sourceChapters.join('、')} 章 · {ep.targetDuration} ·{' '}
                  {ep.platformSellingPoint}
                </div>
              </div>
              <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
                {ep.status}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default EpisodeList;
