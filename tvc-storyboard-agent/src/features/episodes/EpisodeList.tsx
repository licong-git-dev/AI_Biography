import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useEpisodeStore, useShotStore } from '../../stores';
import type { Priority } from '../../types';
import EpisodeEditModal from './EpisodeEditModal';

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
  const remove = useEpisodeStore((s) => s.remove);
  const removeShotsByEpisode = useShotStore((s) => s.removeByEpisode);
  const shots = useShotStore((s) => s.shots);

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDelete = (id: string, title: string, shotCount: number) => {
    const msg =
      shotCount > 0
        ? `删除《${title}》及其 ${shotCount} 个镜头？此操作不可撤销。`
        : `删除《${title}》？此操作不可撤销。`;
    if (!confirm(msg)) return;
    removeShotsByEpisode(id);
    remove(id);
  };

  return (
    <>
      <div className="space-y-2">
        {episodes.map((ep) => {
          const active = ep.id === activeId;
          const shotCount = shots.filter((s) => s.episodeId === ep.id).length;

          return (
            <div
              key={ep.id}
              className={`group rounded-lg border transition ${
                active
                  ? 'border-neutral-600 bg-neutral-900'
                  : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
              }`}
            >
              <button
                onClick={() => setActive(active ? null : ep.id)}
                className="block w-full p-3 text-left"
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
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
                      来源：第 {ep.sourceChapters.join('、')} 章 ·{' '}
                      {ep.targetDuration} · {ep.platformSellingPoint}
                      {shotCount > 0 && ` · ${shotCount} 镜`}
                    </div>
                  </div>
                  <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
                    {ep.status}
                  </span>
                </div>
              </button>

              <div className="flex items-center justify-end gap-1 border-t border-neutral-800/60 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(ep.id);
                  }}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                  type="button"
                  title="编辑"
                >
                  <Pencil size={10} /> 编辑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(ep.id, ep.title, shotCount);
                  }}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-950/40 hover:text-red-300"
                  type="button"
                  title="删除"
                >
                  <Trash2 size={10} /> 删除
                </button>
              </div>
            </div>
          );
        })}

        {episodes.length === 0 && (
          <div className="rounded border border-dashed border-neutral-800 bg-neutral-900/30 p-6 text-center text-xs text-neutral-500">
            所有集数都删完了。切到「章节」tab 点一章「AI 拆集」重新生成。
          </div>
        )}
      </div>

      <EpisodeEditModal
        episodeId={editingId}
        open={editingId !== null}
        onClose={() => setEditingId(null)}
      />
    </>
  );
};

export default EpisodeList;
