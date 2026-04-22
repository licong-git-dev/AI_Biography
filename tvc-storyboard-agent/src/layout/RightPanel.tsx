import React from 'react';
import {
  useCharacterStore,
  useEpisodeStore,
  useShotStore,
} from '../stores';

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

  return (
    <div className="p-4 space-y-5">
      {activeCharacter ? (
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
            选中角色
          </div>
          <div className="text-sm font-semibold">{activeCharacter.name}</div>
          <div className="text-xs text-neutral-400 mt-0.5">
            {activeCharacter.group} · {activeCharacter.ageRange}
          </div>
          <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
            {activeCharacter.positioning}
          </p>

          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
              气质
            </div>
            <div className="flex flex-wrap gap-1">
              {activeCharacter.vibe.map((v) => (
                <span
                  key={v}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
              一致性参考图
            </div>
            <div className="text-[11px] text-neutral-500 italic">
              {activeCharacter.referenceImageUrl
                ? '已生成'
                : 'Phase 3 · 调 Nano Banana Pro 生成 6 视图宫格'}
            </div>
          </div>
        </div>
      ) : activeEpisode ? (
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
            选中集数
          </div>
          <div className="text-sm font-semibold">《{activeEpisode.title}》</div>
          <div className="text-xs text-neutral-400 mt-0.5">
            EP{String(activeEpisode.episodeNumber).padStart(2, '0')} ·{' '}
            {activeEpisode.format}
          </div>

          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
              记忆点
            </div>
            <div className="flex flex-wrap gap-1">
              {activeEpisode.memoryPoints.map((p) => (
                <span
                  key={p}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
              镜头表
            </div>
            <div className="text-[11px] text-neutral-400">
              {episodeShots.length === 0
                ? 'Phase 4 · 从章节原文拆集生成镜头表'
                : `${episodeShots.length} 条镜头已就位`}
            </div>
            {episodeShots.length > 0 && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                {episodeShots.map((s) => (
                  <div
                    key={s.id}
                    className="text-[10px] text-neutral-400 py-0.5 border-b border-neutral-800/50 last:border-0"
                  >
                    <span className="font-mono text-neutral-500">{s.number}</span>{' '}
                    {s.shotSize} · {s.duration}s — {s.description}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; placeholder: string }> = ({
  title,
  placeholder,
}) => (
  <div>
    <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
      {title}
    </div>
    <div className="text-xs text-neutral-600 italic">{placeholder}</div>
  </div>
);

export default RightPanel;
