import React from 'react';
import { CalendarDays } from 'lucide-react';
import type { Episode, Priority } from '../../types';
import { useEpisodeStore } from '../../stores';

const PRIORITY_COLOR: Record<Priority, string> = {
  S: 'bg-red-900/40 text-red-300 border-red-800/50',
  A: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
  'A-': 'bg-amber-900/20 text-amber-400 border-amber-800/30',
  B: 'bg-neutral-800 text-neutral-400 border-neutral-700',
};

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function weekdayZh(ts: number): string {
  return ['日', '一', '二', '三', '四', '五', '六'][new Date(ts).getDay()]!;
}

const EpisodeCalendar: React.FC = () => {
  const episodes = useEpisodeStore((s) => s.episodes);
  const setActive = useEpisodeStore((s) => s.setActive);

  const scheduled = episodes.filter((e) => e.plannedReleaseAt);
  const unscheduled = episodes.filter((e) => !e.plannedReleaseAt);

  // 按日分组
  const byDay = new Map<number, Episode[]>();
  for (const ep of scheduled) {
    const k = startOfDay(ep.plannedReleaseAt!);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(ep);
  }
  const sortedDays = Array.from(byDay.keys()).sort((a, b) => a - b);

  const now = startOfDay(Date.now());

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays size={14} className="text-neutral-400" />
        <span className="text-sm font-medium text-neutral-200">发布日历</span>
        <span className="text-[11px] text-neutral-500">
          {scheduled.length} 已排期 · {unscheduled.length} 未排
        </span>
      </div>

      {scheduled.length === 0 ? (
        <div className="rounded border border-dashed border-neutral-800 bg-neutral-900/30 p-6 text-center text-xs text-neutral-500">
          还没有集安排发布日期。
          <br />
          在「集数」tab 点任一集「编辑」→ 填「计划发布日期」。
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedDays.map((day) => {
            const eps = byDay.get(day)!;
            const isPast = day < now;
            const isToday = day === now;
            return (
              <div
                key={day}
                className={`rounded-lg border p-2.5 ${
                  isToday
                    ? 'border-sky-700 bg-sky-950/20'
                    : isPast
                      ? 'border-neutral-800/60 bg-neutral-900/20 opacity-70'
                      : 'border-neutral-800 bg-neutral-900/40'
                }`}
              >
                <div className="mb-1.5 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-sm font-medium text-neutral-100">
                      {formatDate(day)}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      周{weekdayZh(day)}
                    </span>
                    {isToday && (
                      <span className="rounded bg-sky-700/40 px-1.5 py-0.5 text-[10px] text-sky-200">
                        今天
                      </span>
                    )}
                    {isPast && !isToday && (
                      <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-500">
                        已过
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {eps.length} 集
                  </span>
                </div>
                <div className="space-y-1">
                  {eps.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => setActive(ep.id)}
                      className="flex w-full items-center justify-between gap-2 rounded border border-neutral-800/60 bg-neutral-900/50 px-2 py-1.5 text-left hover:border-neutral-700"
                      type="button"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-neutral-500">
                            EP{String(ep.episodeNumber).padStart(2, '0')}
                          </span>
                          <span className="truncate text-xs text-neutral-100">
                            《{ep.title}》
                          </span>
                          <span
                            className={`rounded border px-1 py-0.5 text-[9px] ${PRIORITY_COLOR[ep.priority]}`}
                          >
                            {ep.priority}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] text-neutral-400">
                        {ep.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unscheduled.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[11px] text-neutral-500">
            未排期（{unscheduled.length}）
          </div>
          <div className="flex flex-wrap gap-1">
            {unscheduled.map((ep) => (
              <button
                key={ep.id}
                onClick={() => setActive(ep.id)}
                className="rounded border border-neutral-800 bg-neutral-900/40 px-1.5 py-0.5 text-[10px] text-neutral-400 hover:border-neutral-700"
                type="button"
              >
                EP{String(ep.episodeNumber).padStart(2, '0')}
                《{ep.title}》
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EpisodeCalendar;
