import React, { useState } from 'react';
import { Image as ImageIcon, Film, Volume2 } from 'lucide-react';
import {
  useCharacterStore,
  useEpisodeStore,
  useShotStore,
} from '../stores';
import CharacterReferencePanel from '../features/characters/CharacterReferencePanel';
import CharacterEditModal from '../features/characters/CharacterEditModal';
import ChatPanel from '../features/chat/ChatPanel';
import PublishingPanel from '../features/publishing/PublishingPanel';
import MetricsPanel from '../features/publishing/MetricsPanel';
import HookWorkshop from '../features/episodes/HookWorkshop';

type RightTab = 'context' | 'chat';

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
  const [tab, setTab] = useState<RightTab>('context');

  return (
    <>
      <div className="flex h-full flex-col">
        {/* 顶部 tab 切换 */}
        <div className="shrink-0 flex items-center gap-1 border-b border-neutral-800 px-3 py-1.5">
          <TabButton
            active={tab === 'context'}
            onClick={() => setTab('context')}
          >
            详情
          </TabButton>
          <TabButton active={tab === 'chat'} onClick={() => setTab('chat')}>
            询问 AI
          </TabButton>
        </div>

        {/* 内容 */}
        {tab === 'chat' ? (
          <div className="min-h-0 flex-1">
            <ChatPanel />
          </div>
        ) : (
          <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
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

                {(activeEpisode.hook ||
                  activeEpisode.climax ||
                  activeEpisode.suspense) && (
                  <div className="mt-3 space-y-1.5">
                    {activeEpisode.hook && (
                      <Kv label="钩子" value={activeEpisode.hook} />
                    )}
                    {activeEpisode.climax && (
                      <Kv label="高潮" value={activeEpisode.climax} />
                    )}
                    {activeEpisode.suspense && (
                      <Kv label="悬念" value={activeEpisode.suspense} />
                    )}
                  </div>
                )}

                <HookWorkshop episode={activeEpisode} />
                <MetricsPanel episode={activeEpisode} />

                <div className="mt-3">
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">
                    镜头表
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {episodeShots.length === 0
                      ? '切到「镜头」tab · AI 生成镜头表'
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
                          <span className="ml-1 inline-flex items-center gap-0.5 align-middle">
                            {s.keyframeUrl && (
                              <ImageIcon
                                size={10}
                                className="text-emerald-400"
                                aria-label="关键帧已生成"
                              />
                            )}
                            {s.videoUrl && (
                              <Film
                                size={10}
                                className="text-violet-400"
                                aria-label="视频已生成"
                              />
                            )}
                            {s.voiceUrl && (
                              <Volume2
                                size={10}
                                className="text-amber-400"
                                aria-label="配音已生成"
                              />
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <PublishingPanel episode={activeEpisode} />
              </div>
            ) : (
              <div className="space-y-4">
                <Section
                  title="AI 任务面板"
                  placeholder="选左侧角色 · 中栏集数 · 中栏章节 · 右栏切「询问 AI」"
                />
                <Section
                  title="输出预览"
                  placeholder="选中对象后显示详情 / 操作"
                />
                <Section
                  title="发布准备"
                  placeholder="第三批 · 标题 / 简介 / 标签 / 封面 / 平台版本"
                />
              </div>
            )}
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

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    type="button"
    className={`relative px-2.5 py-1 text-xs transition ${
      active ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'
    }`}
  >
    {children}
    {active && (
      <span className="absolute inset-x-2.5 -bottom-[7px] h-0.5 bg-neutral-100" />
    )}
  </button>
);

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

const Kv: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="text-[11px]">
    <span className="text-neutral-500">{label}：</span>
    <span className="text-neutral-300">{value}</span>
  </div>
);

export default RightPanel;
