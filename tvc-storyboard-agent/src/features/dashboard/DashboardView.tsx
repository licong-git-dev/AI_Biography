import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Lightbulb,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import {
  useCharacterStore,
  useEpisodeStore,
  useShotStore,
  useAlertsStore,
  useLibraryStore,
  useFeedbackStore,
} from '../../stores';
import { useUIStore } from '../../stores';
import { extractSpeechText } from '../audio/voiceService';

const DashboardView: React.FC = () => {
  const characters = useCharacterStore((s) => s.characters);
  const episodes = useEpisodeStore((s) => s.episodes);
  const shots = useShotStore((s) => s.shots);
  const alerts = useAlertsStore((s) => s.alerts);
  const hooks = useLibraryStore((s) => s.hooks);
  const styles = useLibraryStore((s) => s.styles);
  const setActiveEpisode = useEpisodeStore((s) => s.setActive);
  const setCenterTab = useUIStore((s) => s.setCenterTab);

  // 派生指标：用 useMemo 避免 episodes/shots 没变时重算
  const derived = useMemo(() => {
    // 用 Map 把 shots 按 episode 分组一次，避免在 episodes.map 里对
    // shots 做 N×M filter
    const shotsByEpisode = new Map<string, typeof shots>();
    for (const s of shots) {
      const list = shotsByEpisode.get(s.episodeId);
      if (list) list.push(s);
      else shotsByEpisode.set(s.episodeId, [s]);
    }

    const charactersWithRef = characters.filter((c) => c.referenceImageUrl);
    const episodesWithHook = episodes.filter((e) => e.hook);
    const episodesWithMetrics = episodes.filter(
      (e) => (e.metrics?.length ?? 0) > 0
    );
    const episodesWithPack = episodes.filter((e) => e.publishingPack);
    const episodesWithDate = episodes.filter((e) => e.plannedReleaseAt);

    const keyframeDone = shots.filter((s) => s.keyframeUrl).length;
    const videoDone = shots.filter((s) => s.videoUrl).length;
    const voiceNeeded = shots.filter((s) => extractSpeechText(s)).length;
    const voiceDone = shots.filter((s) => s.voiceUrl).length;

    const episodeProgress = episodes.map((ep) => {
      const epShots = shotsByEpisode.get(ep.id) ?? [];
      if (epShots.length === 0)
        return { ep, pct: 0, shotCount: 0, gaps: ['无镜头表'] };

      const keyframes = epShots.filter((s) => s.keyframeUrl).length;
      const videos = epShots.filter((s) => s.videoUrl).length;
      const voiceTargets = epShots.filter((s) => extractSpeechText(s));
      const voices = voiceTargets.filter((s) => s.voiceUrl).length;

      const gaps: string[] = [];
      if (!ep.hook) gaps.push('无钩子');
      if (keyframes < epShots.length)
        gaps.push(`关键帧 ${keyframes}/${epShots.length}`);
      if (videos < epShots.length)
        gaps.push(`视频 ${videos}/${epShots.length}`);
      if (voiceTargets.length > 0 && voices < voiceTargets.length)
        gaps.push(`配音 ${voices}/${voiceTargets.length}`);
      if (!ep.publishingPack) gaps.push('无发布文案');

      const max = 4 + (voiceTargets.length > 0 ? 1 : 0);
      let hit = 0;
      if (ep.hook) hit++;
      if (keyframes === epShots.length) hit++;
      if (videos === epShots.length) hit++;
      if (voiceTargets.length === 0 || voices === voiceTargets.length) hit++;
      if (ep.publishingPack) hit++;

      return {
        ep,
        pct: Math.round((hit / max) * 100),
        shotCount: epShots.length,
        gaps,
      };
    });

    const totalAssets =
      shots.length * 2 +
      voiceNeeded +
      episodes.length * 1 +
      characters.length * 1;
    const doneAssets =
      keyframeDone +
      videoDone +
      voiceDone +
      episodesWithPack.length +
      charactersWithRef.length;
    const overallPct =
      totalAssets > 0 ? Math.round((doneAssets / totalAssets) * 100) : 0;

    return {
      charactersWithRef,
      episodesWithHook,
      episodesWithMetrics,
      episodesWithPack,
      episodesWithDate,
      keyframeDone,
      videoDone,
      voiceDone,
      episodeProgress,
      totalAssets,
      doneAssets,
      overallPct,
    };
  }, [characters, episodes, shots]);

  const {
    charactersWithRef,
    episodesWithHook,
    episodesWithMetrics,
    episodesWithPack,
    episodesWithDate,
    keyframeDone,
    episodeProgress,
    totalAssets,
    doneAssets,
    overallPct,
  } = derived;

  const unackAlerts = useMemo(
    () => alerts.filter((a) => !a.acknowledged),
    [alerts]
  );

  const jumpToEpisode = (epId: string) => {
    setActiveEpisode(epId);
    setCenterTab('episodes');
  };

  return (
    <div className="space-y-5">
      {/* 顶部数字卡 */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={14} className="text-neutral-400" />
          <span className="text-sm font-medium text-neutral-200">
            项目健康度
          </span>
        </div>
        <div className="mb-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-neutral-100">
              {overallPct}%
            </span>
            <span className="text-xs text-neutral-500">整体完成度</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            资产完成 {doneAssets}/{totalAssets}（关键帧 + 视频 + 配音 + 文案 + 角色参考图）
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <StatCard
            label="角色"
            done={charactersWithRef.length}
            total={characters.length}
            unit="参考图"
          />
          <StatCard
            label="集数钩子"
            done={episodesWithHook.length}
            total={episodes.length}
            unit="已设计"
          />
          <StatCard
            label="关键帧"
            done={keyframeDone}
            total={shots.length}
            unit="已生成"
          />
          <StatCard
            label="发布文案"
            done={episodesWithPack.length}
            total={episodes.length}
            unit="已产出"
          />
        </div>
      </div>

      {/* 警报汇总 */}
      {unackAlerts.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-200">
            <AlertTriangle size={12} />
            待处理的联动警报 · {unackAlerts.length}
          </div>
          <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-2">
            <ul className="space-y-1 text-[11px] text-amber-100">
              {unackAlerts.slice(0, 5).map((a) => {
                const ep = episodes.find((e) => e.id === a.affectedEpisodeId);
                return (
                  <li
                    key={a.id}
                    className="flex items-start gap-1.5 cursor-pointer hover:underline"
                    onClick={() => ep && jumpToEpisode(ep.id)}
                  >
                    <span
                      className={`mt-0.5 rounded px-1 py-0.5 text-[9px] ${
                        a.severity === 'critical'
                          ? 'bg-red-800'
                          : a.severity === 'warning'
                            ? 'bg-amber-800'
                            : 'bg-neutral-700'
                      }`}
                    >
                      {a.severity}
                    </span>
                    <span>
                      {ep
                        ? `EP${String(ep.episodeNumber).padStart(2, '0')}：`
                        : ''}
                      {a.message}
                    </span>
                  </li>
                );
              })}
              {unackAlerts.length > 5 && (
                <li className="text-[10px] text-amber-300">
                  还有 {unackAlerts.length - 5} 条…
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* 每集进度列表 */}
      <div>
        <div className="mb-2 text-xs font-medium text-neutral-200">
          每集进度
        </div>
        <div className="space-y-1.5">
          {episodeProgress
            .sort((a, b) => a.ep.episodeNumber - b.ep.episodeNumber)
            .map(({ ep, pct, shotCount, gaps }) => (
              <button
                key={ep.id}
                onClick={() => jumpToEpisode(ep.id)}
                className="block w-full rounded border border-neutral-800 bg-neutral-900/40 p-2 text-left hover:border-neutral-700"
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-[11px] text-neutral-500">
                      EP{String(ep.episodeNumber).padStart(2, '0')}
                    </span>
                    <span className="truncate text-xs text-neutral-100">
                      《{ep.title}》
                    </span>
                    {shotCount > 0 && (
                      <span className="shrink-0 text-[10px] text-neutral-500">
                        {shotCount} 镜
                      </span>
                    )}
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[11px] ${
                      pct >= 80
                        ? 'text-emerald-400'
                        : pct >= 40
                          ? 'text-amber-400'
                          : 'text-neutral-500'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className={`h-full transition-all ${
                      pct >= 80
                        ? 'bg-emerald-500'
                        : pct >= 40
                          ? 'bg-amber-500'
                          : 'bg-neutral-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {gaps.length > 0 && (
                  <div className="mt-1 text-[10px] text-neutral-500">
                    缺口：{gaps.join(' · ')}
                  </div>
                )}
              </button>
            ))}
        </div>
      </div>

      {/* 运营资产 */}
      <div className="grid grid-cols-2 gap-3">
        <MiniCard
          label="已排期发布"
          primary={`${episodesWithDate.length}`}
          sub={`/ ${episodes.length} 集`}
        />
        <MiniCard
          label="发布后录入数据"
          primary={`${episodesWithMetrics.length}`}
          sub={`/ ${episodes.length} 集`}
        />
        <MiniCard
          label="金句 / 钩子库"
          primary={`${hooks.length}`}
          sub="已收藏"
        />
        <MiniCard
          label="风格模板库"
          primary={`${styles.length}`}
          sub="已保存"
        />
      </div>

      <FeedbackInsights />
    </div>
  );
};

const FeedbackInsights: React.FC = () => {
  const entries = useFeedbackStore((s) => s.entries);

  const stats = useMemo(() => {
    if (entries.length === 0) return null;

    const byVerdict = { up: 0, down: 0, adopted: 0, rejected: 0 };
    const styleTally: Record<string, { up: number; down: number }> = {};
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let recentWeek = 0;

    for (const e of entries) {
      byVerdict[e.verdict] = (byVerdict[e.verdict] ?? 0) + 1;
      if (e.createdAt >= oneWeekAgo) recentWeek++;
      const style = e.sample?.style;
      if (style && (e.verdict === 'up' || e.verdict === 'adopted')) {
        styleTally[style] = styleTally[style] ?? { up: 0, down: 0 };
        styleTally[style]!.up++;
      }
      if (style && (e.verdict === 'down' || e.verdict === 'rejected')) {
        styleTally[style] = styleTally[style] ?? { up: 0, down: 0 };
        styleTally[style]!.down++;
      }
    }

    const totalPositive = byVerdict.up + byVerdict.adopted;
    const totalNegative = byVerdict.down + byVerdict.rejected;
    const adoptionRate =
      totalPositive + totalNegative > 0
        ? Math.round((totalPositive / (totalPositive + totalNegative)) * 100)
        : 0;

    const topStyles = Object.entries(styleTally)
      .map(([style, counts]) => ({
        style,
        score: counts.up - counts.down,
        up: counts.up,
        down: counts.down,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return {
      total: entries.length,
      byVerdict,
      adoptionRate,
      recentWeek,
      topStyles,
      totalPositive,
      totalNegative,
    };
  }, [entries]);

  if (!stats) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-neutral-800 bg-neutral-900/30 p-4 text-[11px] text-neutral-500">
        <Lightbulb size={11} className="mr-1 inline text-neutral-600" />
        用一段时间后，这里会展示你的 AI 口味画像（最常采用哪种风格、反馈趋势等）。
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-200">
          <Lightbulb size={12} className="text-amber-300" />
          口味画像（反馈洞察）
        </span>
        <span className="text-[10px] text-neutral-500">
          共 {stats.total} 条反馈 · 近 7 天 {stats.recentWeek} 条
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded border border-neutral-800 bg-neutral-900/40 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            正向
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <ThumbsUp size={10} className="text-emerald-400" />
            <span className="font-semibold text-emerald-300">
              {stats.totalPositive}
            </span>
            <span className="text-[10px] text-neutral-600">
              / 采用 {stats.byVerdict.adopted}
            </span>
          </div>
        </div>
        <div className="rounded border border-neutral-800 bg-neutral-900/40 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            负向
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <ThumbsDown size={10} className="text-red-400" />
            <span className="font-semibold text-red-300">
              {stats.totalNegative}
            </span>
            <span className="text-[10px] text-neutral-600">
              / 丢弃 {stats.byVerdict.rejected}
            </span>
          </div>
        </div>
        <div className="rounded border border-neutral-800 bg-neutral-900/40 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            采用率
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="font-semibold text-neutral-100">
              {stats.adoptionRate}%
            </span>
            <span className="text-[10px] text-neutral-500">
              {stats.adoptionRate >= 60
                ? '口味稳定'
                : stats.adoptionRate >= 30
                  ? '还在试'
                  : '挑剔型'}
            </span>
          </div>
        </div>
      </div>

      {stats.topStyles.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">
            偏好风格 TOP 3
          </div>
          <div className="space-y-1">
            {stats.topStyles.map((s, i) => (
              <div
                key={s.style}
                className="flex items-center gap-2 text-[11px]"
              >
                <span className="w-6 font-mono text-neutral-600">
                  #{i + 1}
                </span>
                <span className="flex-1 text-neutral-200">{s.style}</span>
                <span className="font-mono text-[10px] text-emerald-400">
                  +{s.up}
                </span>
                {s.down > 0 && (
                  <span className="font-mono text-[10px] text-red-400">
                    -{s.down}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-neutral-600">
            这些偏好会注入到下次 AI 钩子生成的 prompt 里，让输出贴近你的口味。
          </p>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  done: number;
  total: number;
  unit: string;
}> = ({ label, done, total, unit }) => {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-lg font-semibold text-neutral-100">{done}</span>
        <span className="text-[10px] text-neutral-500">/ {total} {unit}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full bg-sky-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const MiniCard: React.FC<{
  label: string;
  primary: string;
  sub: string;
}> = ({ label, primary, sub }) => (
  <div className="rounded border border-neutral-800 bg-neutral-900/40 p-2.5">
    <div className="text-[10px] uppercase tracking-wide text-neutral-500">
      {label}
    </div>
    <div className="mt-0.5">
      <span className="text-xl font-semibold text-neutral-100">{primary}</span>
      <span className="ml-1 text-[10px] text-neutral-500">{sub}</span>
    </div>
  </div>
);

export default DashboardView;
