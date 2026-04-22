import React, { useState } from 'react';
import {
  useChapterStore,
  useCharacterStore,
  useEpisodeStore,
  useShotStore,
  useUIStore,
  type CenterTab,
} from '../stores';
import { SEASON_NAME, SEASON_CORE_EMOTIONS } from '../data/episodes';
import EpisodeList from '../features/episodes/EpisodeList';
import ChapterList from '../features/chapters/ChapterList';
import ChapterDetail from '../features/chapters/ChapterDetail';
import ShotTable from '../features/shots/ShotTable';

const TABS: { id: CenterTab; label: string; hint: string }[] = [
  { id: 'episodes', label: '集数', hint: '第一季主剧情集规划' },
  { id: 'chapters', label: '章节', hint: '9 章原书稿' },
  { id: 'shots', label: '镜头', hint: '镜头表 / 生产状态' },
];

const CenterPanel: React.FC = () => {
  const centerTab = useUIStore((s) => s.centerTab);
  const setCenterTab = useUIStore((s) => s.setCenterTab);

  const chapterCount = useChapterStore((s) => s.chapters.length);
  const characterCount = useCharacterStore((s) => s.characters.length);
  const episodeCount = useEpisodeStore((s) => s.episodes.length);
  const shotCount = useShotStore((s) => s.shots.length);

  const [chapterDetailId, setChapterDetailId] = useState<string | null>(null);

  const activeTab = TABS.find((t) => t.id === centerTab) ?? TABS[0];

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-neutral-800 bg-neutral-950 px-6 pt-5 pb-3">
        <h1 className="text-lg font-semibold text-neutral-100">{SEASON_NAME}</h1>
        <p className="mt-1 text-xs text-neutral-500">
          核心情绪：{SEASON_CORE_EMOTIONS.join(' · ')}
        </p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <StatCard label="章节" value={chapterCount} unit="章" />
          <StatCard label="角色" value={characterCount} unit="个" />
          <StatCard label="集数" value={episodeCount} unit="集" />
          <StatCard label="镜头" value={shotCount} unit="条" />
        </div>

        <div className="mt-4 flex items-end gap-1 border-b border-neutral-800/60">
          {TABS.map((t) => {
            const active = t.id === centerTab;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setCenterTab(t.id);
                  if (t.id !== 'chapters') setChapterDetailId(null);
                }}
                className={`relative px-3 py-2 text-sm transition ${
                  active
                    ? 'text-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
                type="button"
              >
                {t.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 bg-neutral-100" />
                )}
              </button>
            );
          })}
          <span className="ml-2 pb-2 text-[11px] text-neutral-600">
            {activeTab.hint}
          </span>
        </div>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
        {centerTab === 'episodes' && <EpisodeList />}
        {centerTab === 'chapters' &&
          (chapterDetailId ? (
            <ChapterDetail
              chapterId={chapterDetailId}
              onBack={() => setChapterDetailId(null)}
            />
          ) : (
            <ChapterList onSelect={setChapterDetailId} />
          ))}
        {centerTab === 'shots' && <ShotTable />}
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  unit: string;
}> = ({ label, value, unit }) => (
  <div className="rounded border border-neutral-800 bg-neutral-900/40 px-3 py-2">
    <div className="text-[10px] uppercase tracking-wide text-neutral-500">
      {label}
    </div>
    <div className="mt-0.5 flex items-baseline gap-1">
      <span className="text-lg font-semibold text-neutral-100">{value}</span>
      <span className="text-[11px] text-neutral-500">{unit}</span>
    </div>
  </div>
);

export default CenterPanel;
