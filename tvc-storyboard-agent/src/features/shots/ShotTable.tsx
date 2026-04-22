import React from 'react';
import {
  useShotStore,
  useEpisodeStore,
  useCharacterStore,
} from '../../stores';
import type { ShotGenStatus } from '../../types';

const STATUS_COLOR: Record<ShotGenStatus, string> = {
  未生成: 'bg-neutral-800 text-neutral-500',
  生成中: 'bg-sky-900/40 text-sky-300',
  已生成: 'bg-emerald-900/40 text-emerald-300',
  失败: 'bg-red-900/40 text-red-300',
};

const ShotTable: React.FC = () => {
  const shots = useShotStore((s) => s.shots);
  const activeEpisodeId = useEpisodeStore((s) => s.activeId);
  const getEpisode = useEpisodeStore((s) => s.getById);
  const getCharacter = useCharacterStore((s) => s.getById);

  const filteredShots = activeEpisodeId
    ? shots.filter((s) => s.episodeId === activeEpisodeId)
    : shots;

  const activeEpisode = activeEpisodeId ? getEpisode(activeEpisodeId) : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          {activeEpisode ? (
            <div className="text-xs text-neutral-400">
              当前过滤：EP
              {String(activeEpisode.episodeNumber).padStart(2, '0')}
              《{activeEpisode.title}》· {filteredShots.length} 条镜头
            </div>
          ) : (
            <div className="text-xs text-neutral-400">
              全部镜头 · {filteredShots.length} 条（在「集数」tab 选中一集后过滤）
            </div>
          )}
        </div>
      </div>

      {filteredShots.length === 0 ? (
        <div className="rounded border border-dashed border-neutral-800 bg-neutral-900/40 p-8 text-center text-sm text-neutral-500">
          当前集数还没有镜头。Phase 4 将支持从章节原文自动拆出镜头表。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900 text-neutral-400">
              <tr>
                <th className="px-3 py-2 font-medium">镜号</th>
                <th className="px-3 py-2 font-medium">景别</th>
                <th className="px-3 py-2 font-medium">时长</th>
                <th className="px-3 py-2 font-medium">画面描述</th>
                <th className="px-3 py-2 font-medium">角色</th>
                <th className="px-3 py-2 font-medium">生成方式</th>
                <th className="px-3 py-2 font-medium">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredShots.map((shot) => {
                const charNames = shot.characters
                  .map((id) => getCharacter(id)?.name ?? id)
                  .join('、');
                return (
                  <tr
                    key={shot.id}
                    className="bg-neutral-950 hover:bg-neutral-900/60"
                  >
                    <td className="px-3 py-2 font-mono text-neutral-500">
                      {shot.number}
                    </td>
                    <td className="px-3 py-2 text-neutral-300">
                      {shot.shotSize}
                    </td>
                    <td className="px-3 py-2 text-neutral-400">
                      {shot.duration}s
                    </td>
                    <td className="px-3 py-2 text-neutral-200">
                      {shot.description}
                    </td>
                    <td className="px-3 py-2 text-neutral-400">
                      {charNames || '—'}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-neutral-500">
                      {shot.genMethod}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${STATUS_COLOR[shot.genStatus]}`}
                      >
                        {shot.genStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShotTable;
