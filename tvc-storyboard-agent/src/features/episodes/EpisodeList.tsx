import React, { useMemo, useState } from 'react';
import { AlertTriangle, Copy, Pencil, Search, Trash2, X as XIcon } from 'lucide-react';
import { useAlertsStore, useEpisodeStore, useShotStore } from '../../stores';
import type { Episode, Priority } from '../../types';
import EpisodeEditModal from './EpisodeEditModal';
import { toast } from '../../stores/toastStore';

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
  const add = useEpisodeStore((s) => s.add);
  const nextEpisodeNumber = useEpisodeStore((s) => s.nextEpisodeNumber);
  const removeShotsByEpisode = useShotStore((s) => s.removeByEpisode);
  const shots = useShotStore((s) => s.shots);
  const alerts = useAlertsStore((s) => s.alerts);
  const clearAlertsByEpisode = useAlertsStore((s) => s.clearByEpisode);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredEpisodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return episodes;
    return episodes.filter((e) => {
      const hay = [
        e.title,
        e.mainConflict,
        e.hook ?? '',
        e.climax ?? '',
        e.suspense ?? '',
        e.memoryPoints.join(' '),
        e.platformSellingPoint,
        e.format,
        e.status,
        e.priority,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [episodes, search]);

  const handleDelete = (id: string, title: string, shotCount: number) => {
    const msg =
      shotCount > 0
        ? `删除《${title}》及其 ${shotCount} 个镜头？此操作不可撤销。`
        : `删除《${title}》？此操作不可撤销。`;
    if (!confirm(msg)) return;
    removeShotsByEpisode(id);
    clearAlertsByEpisode(id);
    remove(id);
  };

  const handleClone = (source: Episode) => {
    const n = nextEpisodeNumber(source.seasonNumber);
    const copy: Episode = {
      ...source,
      id: `ep-s${source.seasonNumber}-${String(n).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6)}`,
      episodeNumber: n,
      title: `${source.title}（副本）`,
      status: '规划中',
      shotIds: undefined, // 副本不继承镜头引用，走一份新镜头表
      publishingPack: undefined, // 发布包也得重新生成
    };
    add(copy);
    setActive(copy.id);
    toast.success(
      `《${source.title}》已复制为 EP${String(n).padStart(2, '0')}，位于本季末尾`
    );
  };

  return (
    <>
      <div className="mb-3 relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`搜索集数（标题 / 记忆点 / 主冲突...）· ${search ? filteredEpisodes.length : episodes.length} 条`}
          className="w-full rounded border border-neutral-800 bg-neutral-900 pl-7 pr-7 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-700 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
            type="button"
            title="清除"
          >
            <XIcon size={11} />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {filteredEpisodes.map((ep) => {
          const active = ep.id === activeId;
          const shotCount = shots.filter((s) => s.episodeId === ep.id).length;
          const epAlerts = alerts.filter(
            (a) => a.affectedEpisodeId === ep.id && !a.acknowledged
          );
          const hasCritical = epAlerts.some((a) => a.severity === 'critical');

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
                      {epAlerts.length > 0 && (
                        <span
                          className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] ${
                            hasCritical
                              ? 'border-red-800 bg-red-950/40 text-red-300'
                              : 'border-amber-800 bg-amber-950/40 text-amber-300'
                          }`}
                          title="前面集的改动可能影响本集，点编辑查看"
                        >
                          <AlertTriangle size={9} />
                          联动 {epAlerts.length}
                        </span>
                      )}
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
                    handleClone(ep);
                  }}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                  type="button"
                  title="复制一份（A/B 对比）"
                >
                  <Copy size={10} /> 复制
                </button>
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

        {episodes.length > 0 && filteredEpisodes.length === 0 && (
          <div className="rounded border border-dashed border-neutral-800 bg-neutral-900/30 p-4 text-center text-xs text-neutral-500">
            没有匹配「{search}」的集数
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
