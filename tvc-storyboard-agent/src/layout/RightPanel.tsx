import React, { useState } from 'react';
import {
  useCharacterStore,
  useEpisodeStore,
  useShotStore,
} from '../stores';
import CharacterReferencePanel from '../features/characters/CharacterReferencePanel';
import CharacterEditModal from '../features/characters/CharacterEditModal';

const RightPanel: React.FC = () => {
  const activeCharacterId = useCharacterStore((s) => s.activeId);
  const getCharacter = useCharacterStore((s) => s.getById);
  const activeCharacter = activeCharacterId
    ? getCharacter(activeCharacterId)
    : null;

  const activeEpisodeId = useEpisodeStore((s) => s.activeId);
  const getEpisode = useEpisodeStore((s) => s.getById);
  const activeEpisode = activeEpisodeId ? getEpisode(activeEpisodeId) : null;

  const byEpisode = useShotStore((s) => s.byEpisode);
  const episodeShots = activeEpisodeId ? byEpisode(activeEpisodeId) : [];

  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(
    null
  );

  return (
    <>
      <div className="p-4">
        {activeCharacter ? (
          <CharacterReferencePanel
            character={activeCharacter}
            onEdit={() => setEditingCharacterId(activeCharacter.id)}
          />
        ) : activeEpisode ? (
          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
              选中集数
            </div>
            <div className="text-sm font-semibold">
              《{activeEpisode.title}》
            </div>
            <div className="mt-0.5 text-xs text-neutral-400">
              EP{String(activeEpisode.episodeNumber).padStart(2, '0')} ·{' '}
              {activeEpisode.format}
            </div>

            <div className="mt-3">
              <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">
                记忆点
              </div>
              <div className="flex flex-wrap gap-1">
                {activeEpisode.memoryPoints.map((p) => (
                  <span
                    key={p}
                    className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">
                镜头表
              </div>
              <div className="text-[11px] text-neutral-400">
                {episodeShots.length === 0
                  ? 'Phase 4 · 从章节原文拆集生成镜头表'
                  : `${episodeShots.length} 条镜头已就位`}
              </div>
              {episodeShots.length > 0 && (
                <div className="scrollbar-thin mt-2 max-h-48 space-y-1 overflow-y-auto">
                  {episodeShots.map((s) => (
                    <div
                      key={s.id}
                      className="border-b border-neutral-800/50 py-0.5 text-[10px] text-neutral-400 last:border-0"
                    >
                      <span className="font-mono text-neutral-500">
                        {s.number}
                      </span>{' '}
                      {s.shotSize} · {s.duration}s — {s.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Section
              title="AI 任务面板"
              placeholder="Phase 4-5 · 章节拆集 / 角色一致性 / 关键帧"
            />
            <Section
              title="输出预览"
              placeholder="点左侧角色 或 中间集数 查看细节"
            />
            <Section
              title="发布准备"
              placeholder="第三批 · 标题 / 简介 / 标签 / 封面 / 平台版本"
            />
          </div>
        )}
      </div>

      <CharacterEditModal
        characterId={editingCharacterId}
        open={editingCharacterId !== null}
        onClose={() => setEditingCharacterId(null)}
      />
    </>
  );
};

const Section: React.FC<{ title: string; placeholder: string }> = ({
  title,
  placeholder,
}) => (
  <div>
    <div className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
      {title}
    </div>
    <div className="text-xs italic text-neutral-600">{placeholder}</div>
  </div>
);

export default RightPanel;
