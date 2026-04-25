import React, { useState } from 'react';
import { AlertCircle, Calendar, X } from 'lucide-react';
import { useEpisodeStore, useUIStore } from '../stores';

const DAY_MS = 24 * 60 * 60 * 1000;
const DISMISS_KEY = 'licong-release-banner-dismissed-until';

function readDismissUntil(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

function setDismissUntil(ts: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DISMISS_KEY, String(ts));
}

const ReleaseReminderBanner: React.FC = () => {
  const episodes = useEpisodeStore((s) => s.episodes);
  const setActive = useEpisodeStore((s) => s.setActive);
  const setCenterTab = useUIStore((s) => s.setCenterTab);
  const [dismissUntil, setDismiss] = useState<number>(readDismissUntil());

  const now = Date.now();

  // 4 小时内不重复打扰
  if (now < dismissUntil) return null;

  const overdue = episodes
    .filter((e) => {
      if (!e.plannedReleaseAt) return false;
      if (e.plannedReleaseAt >= now) return false;
      // 已录入任何平台 metrics 视为已发布，不再提醒
      if ((e.metrics?.length ?? 0) > 0) return false;
      return true;
    })
    .sort((a, b) => (a.plannedReleaseAt ?? 0) - (b.plannedReleaseAt ?? 0));

  const upcoming = episodes
    .filter((e) => {
      if (!e.plannedReleaseAt) return false;
      const daysTo = (e.plannedReleaseAt - now) / DAY_MS;
      return daysTo >= 0 && daysTo <= 3;
    })
    .sort((a, b) => (a.plannedReleaseAt ?? 0) - (b.plannedReleaseAt ?? 0));

  if (overdue.length === 0 && upcoming.length === 0) return null;

  const jump = (epId: string) => {
    setActive(epId);
    setCenterTab('calendar');
  };

  const dismissFor4h = () => {
    const until = Date.now() + 4 * 60 * 60 * 1000;
    setDismissUntil(until);
    setDismiss(until);
  };

  return (
    <div className="shrink-0 border-b border-neutral-800 bg-neutral-900/40 px-4 py-1.5">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-1">
          {overdue.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <AlertCircle size={11} className="shrink-0 text-red-400" />
              <span className="font-medium text-red-300">
                {overdue.length} 集过期未发布：
              </span>
              {overdue.slice(0, 4).map((e) => {
                const daysOverdue = Math.ceil(
                  (now - (e.plannedReleaseAt ?? now)) / DAY_MS
                );
                return (
                  <button
                    key={e.id}
                    onClick={() => jump(e.id)}
                    className="rounded border border-red-900/60 bg-red-950/30 px-1.5 py-0.5 text-red-200 hover:border-red-800"
                    type="button"
                  >
                    EP{String(e.episodeNumber).padStart(2, '0')}《{e.title}》 逾期 {daysOverdue}d
                  </button>
                );
              })}
              {overdue.length > 4 && (
                <span className="text-neutral-500">
                  +{overdue.length - 4} 更多
                </span>
              )}
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <Calendar size={11} className="shrink-0 text-amber-400" />
              <span className="font-medium text-amber-300">
                3 天内 {upcoming.length} 集要发：
              </span>
              {upcoming.slice(0, 5).map((e) => {
                const daysTo = Math.max(
                  0,
                  Math.ceil(((e.plannedReleaseAt ?? now) - now) / DAY_MS)
                );
                return (
                  <button
                    key={e.id}
                    onClick={() => jump(e.id)}
                    className="rounded border border-amber-900/50 bg-amber-950/30 px-1.5 py-0.5 text-amber-200 hover:border-amber-800"
                    type="button"
                  >
                    EP{String(e.episodeNumber).padStart(2, '0')}《{e.title}》
                    {daysTo === 0 ? ' 今天' : ` · ${daysTo}d 后`}
                  </button>
                );
              })}
              {upcoming.length > 5 && (
                <span className="text-neutral-500">
                  +{upcoming.length - 5} 更多
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={dismissFor4h}
          className="shrink-0 rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
          type="button"
          title="4 小时内不再提示"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};

export default ReleaseReminderBanner;
