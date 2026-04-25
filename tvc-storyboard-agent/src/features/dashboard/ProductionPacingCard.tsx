import React, { useMemo } from 'react';
import { CalendarClock, TrendingUp } from 'lucide-react';
import {
  useEpisodeStore,
  useShotStore,
  useUIStore,
} from '../../stores';
import { extractSpeechText } from '../audio/voiceService';

const DAY_MS = 24 * 60 * 60 * 1000;

interface EpisodeGap {
  episodeId: string;
  epNumber: number;
  title: string;
  daysTo: number;
  priority: string;
  missingKeyframes: number;
  missingVideos: number;
  missingVoices: number;
  missingPack: boolean;
  missingHook: boolean;
  /** 总的"单位工作量"：每个缺少的资产 = 1 单位 */
  totalUnits: number;
}

const ProductionPacingCard: React.FC = () => {
  const episodes = useEpisodeStore((s) => s.episodes);
  const setActiveEpisode = useEpisodeStore((s) => s.setActive);
  const shots = useShotStore((s) => s.shots);
  const setCenterTab = useUIStore((s) => s.setCenterTab);

  const now = Date.now();

  const gaps = useMemo<EpisodeGap[]>(() => {
    const result: EpisodeGap[] = [];
    for (const ep of episodes) {
      if (!ep.plannedReleaseAt) continue;
      const daysTo = Math.ceil((ep.plannedReleaseAt - now) / DAY_MS);
      if (daysTo < 0 || daysTo > 7) continue; // 只看未来 7 天内
      if ((ep.metrics?.length ?? 0) > 0) continue; // 已发布跳过

      const epShots = shots.filter((s) => s.episodeId === ep.id);
      const missingKeyframes = epShots.filter((s) => !s.keyframeUrl).length;
      const missingVideos = epShots.filter((s) => !s.videoUrl).length;
      const voiceTargets = epShots.filter((s) => extractSpeechText(s));
      const missingVoices = voiceTargets.filter((s) => !s.voiceUrl).length;
      const missingPack = !ep.publishingPack;
      const missingHook = !ep.hook;

      const totalUnits =
        missingKeyframes +
        missingVideos +
        missingVoices +
        (missingPack ? 1 : 0) +
        (missingHook ? 1 : 0);

      if (totalUnits === 0) continue;

      result.push({
        episodeId: ep.id,
        epNumber: ep.episodeNumber,
        title: ep.title,
        daysTo,
        priority: ep.priority,
        missingKeyframes,
        missingVideos,
        missingVoices,
        missingPack,
        missingHook,
        totalUnits,
      });
    }
    return result.sort((a, b) => a.daysTo - b.daysTo);
  }, [episodes, shots, now]);

  const totalUnits = gaps.reduce((a, g) => a + g.totalUnits, 0);
  /** 未来 7 天内最紧的死线 */
  const minDays = Math.max(1, gaps[0]?.daysTo ?? 7);
  const unitsPerDay = totalUnits > 0 ? Math.ceil(totalUnits / minDays) : 0;

  const jump = (id: string) => {
    setActiveEpisode(id);
    setCenterTab('episodes');
  };

  if (gaps.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-emerald-800/60 bg-emerald-950/10 p-4 text-center text-[11px] text-emerald-300">
        <TrendingUp size={12} className="mr-1 inline" />
        未来 7 天没有已排期且缺资产的集。可以放心招新 / 做长远规划。
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/10 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-200">
          <CalendarClock size={12} />
          本周生产节奏建议
        </span>
        <span className="text-[10px] text-neutral-500">
          死线最近 {minDays} 天
        </span>
      </div>

      <div className="mb-3 rounded border border-neutral-800 bg-neutral-900/60 p-2">
        <div className="text-[11px] text-neutral-200">
          <span className="font-semibold text-amber-300">{totalUnits}</span>{' '}
          单位工作（缺一帧 / 一视频 / 一配音 / 一文案 / 一钩子 = 1 单位）分布在
          <span className="font-semibold text-amber-300"> {gaps.length} </span>
          集里
        </div>
        <div className="mt-1 text-[11px] text-neutral-300">
          按匀速推算，需要日产能约{' '}
          <span className="font-semibold text-amber-300">{unitsPerDay}</span>{' '}
          单位/天，才能赶上最近死线。
        </div>
      </div>

      <div className="space-y-1.5">
        {gaps.map((g) => {
          const gapParts: string[] = [];
          if (g.missingHook) gapParts.push('钩子');
          if (g.missingKeyframes > 0) gapParts.push(`${g.missingKeyframes} 帧`);
          if (g.missingVideos > 0) gapParts.push(`${g.missingVideos} 视`);
          if (g.missingVoices > 0) gapParts.push(`${g.missingVoices} 音`);
          if (g.missingPack) gapParts.push('文案');

          const urgent = g.daysTo <= 2;
          return (
            <button
              key={g.episodeId}
              onClick={() => jump(g.episodeId)}
              className={`flex w-full items-center justify-between gap-2 rounded border px-2 py-1.5 text-left text-[11px] transition ${
                urgent
                  ? 'border-red-800/60 bg-red-950/20 hover:border-red-700'
                  : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
              }`}
              type="button"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-neutral-500">
                  EP{String(g.epNumber).padStart(2, '0')}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] ${
                    urgent
                      ? 'bg-red-900/60 text-red-100'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {g.daysTo === 0 ? '今天' : `${g.daysTo}d`}
                </span>
                <span className="truncate text-neutral-200">《{g.title}》</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-neutral-400">缺 {gapParts.join(' / ')}</span>
                <span className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-neutral-300">
                  {g.totalUnits}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] text-neutral-600">
        点任一集跳转到集数详情。紧急（≤2 天）显示红色。
      </p>
    </div>
  );
};

export default ProductionPacingCard;
