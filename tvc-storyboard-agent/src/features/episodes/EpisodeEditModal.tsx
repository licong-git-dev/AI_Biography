import React, { useEffect, useRef, useState } from 'react';
import type { Episode, EpisodeFormat, EpisodeStatus, Priority } from '../../types';
import { useEpisodeStore } from '../../stores';
import { useEscapeKey } from '../../components/useEscapeKey';
import { useModalSave } from '../../components/useModalSave';
import { useFocusTrap } from '../../components/useFocusTrap';

interface Props {
  episodeId: string | null;
  open: boolean;
  onClose: () => void;
}

const PRIORITIES: Priority[] = ['S', 'A', 'A-', 'B'];
const STATUSES: EpisodeStatus[] = ['规划中', '生产中', '待审', '已完成'];
const FORMATS: EpisodeFormat[] = [
  'A-主剧情',
  'B-爆点切片',
  'C-人物支线',
  'D-金句旁白',
];

interface FormState {
  title: string;
  mainConflict: string;
  hook: string;
  climax: string;
  suspense: string;
  memoryPoints: string;
  platformSellingPoint: string;
  targetDuration: string;
  priority: Priority;
  format: EpisodeFormat;
  status: EpisodeStatus;
  plannedReleaseAt: string; // yyyy-mm-dd，空串表示未定
}

function toForm(e: Episode): FormState {
  return {
    title: e.title,
    mainConflict: e.mainConflict,
    hook: e.hook ?? '',
    climax: e.climax ?? '',
    suspense: e.suspense ?? '',
    memoryPoints: e.memoryPoints.join('\n'),
    platformSellingPoint: e.platformSellingPoint,
    targetDuration: e.targetDuration,
    priority: e.priority,
    format: e.format,
    status: e.status,
    plannedReleaseAt: e.plannedReleaseAt
      ? new Date(e.plannedReleaseAt).toISOString().slice(0, 10)
      : '',
  };
}

function fromForm(f: FormState): Partial<Episode> {
  let plannedReleaseAt: number | undefined = undefined;
  if (f.plannedReleaseAt) {
    const t = new Date(f.plannedReleaseAt).getTime();
    if (Number.isFinite(t)) plannedReleaseAt = t;
  }
  return {
    title: f.title.trim(),
    mainConflict: f.mainConflict.trim(),
    hook: f.hook.trim() || undefined,
    climax: f.climax.trim() || undefined,
    suspense: f.suspense.trim() || undefined,
    memoryPoints: f.memoryPoints
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean),
    platformSellingPoint: f.platformSellingPoint.trim(),
    targetDuration: f.targetDuration.trim(),
    priority: f.priority,
    format: f.format,
    status: f.status,
    plannedReleaseAt,
  };
}

const EpisodeEditModal: React.FC<Props> = ({ episodeId, open, onClose }) => {
  const episode = useEpisodeStore((s) =>
    episodeId ? s.getById(episodeId) : undefined
  );
  const update = useEpisodeStore((s) => s.update);
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (open && episode) setForm(toForm(episode));
  }, [open, episode]);

  const save = () => {
    if (!episode || !form) return;
    update(episode.id, fromForm(form));
    onClose();
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useEscapeKey(open, onClose);
  useModalSave(open && !!form, save);
  useFocusTrap(open, containerRef);

  if (!open || !episode || !form) return null;

  const patch = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="scrollbar-thin max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              S{episode.seasonNumber} · EP
              {String(episode.episodeNumber).padStart(2, '0')}
            </div>
            <h2 className="mt-0.5 text-lg font-semibold text-neutral-100">
              编辑集数
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <Field label="标题">
            <input
              type="text"
              value={form.title}
              onChange={(e) => patch('title', e.target.value)}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="优先级">
              <select
                value={form.priority}
                onChange={(e) => patch('priority', e.target.value as Priority)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="状态">
              <select
                value={form.status}
                onChange={(e) =>
                  patch('status', e.target.value as EpisodeStatus)
                }
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="格式">
              <select
                value={form.format}
                onChange={(e) =>
                  patch('format', e.target.value as EpisodeFormat)
                }
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="目标时长">
              <input
                type="text"
                value={form.targetDuration}
                onChange={(e) => patch('targetDuration', e.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
              />
            </Field>
            <Field label="计划发布日期">
              <input
                type="date"
                value={form.plannedReleaseAt}
                onChange={(e) => patch('plannedReleaseAt', e.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
              />
            </Field>
          </div>

          <Field label="主冲突">
            <textarea
              value={form.mainConflict}
              onChange={(e) => patch('mainConflict', e.target.value)}
              rows={2}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3">
            <Field label="钩子（开头 3 秒）">
              <textarea
                value={form.hook}
                onChange={(e) => patch('hook', e.target.value)}
                rows={2}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
              />
            </Field>
            <Field label="情绪高潮">
              <textarea
                value={form.climax}
                onChange={(e) => patch('climax', e.target.value)}
                rows={2}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
              />
            </Field>
            <Field label="结尾悬念">
              <textarea
                value={form.suspense}
                onChange={(e) => patch('suspense', e.target.value)}
                rows={2}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
              />
            </Field>
          </div>

          <Field label="记忆点（每行一条）">
            <textarea
              value={form.memoryPoints}
              onChange={(e) => patch('memoryPoints', e.target.value)}
              rows={4}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </Field>

          <Field label="平台卖点">
            <textarea
              value={form.platformSellingPoint}
              onChange={(e) =>
                patch('platformSellingPoint', e.target.value)
              }
              rows={2}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-neutral-800 pt-4">
          <button
            onClick={onClose}
            className="rounded border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-700"
            type="button"
          >
            取消
          </button>
          <button
            onClick={save}
            className="rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
            type="button"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <div className="mb-1 text-[11px] uppercase tracking-wide text-neutral-500">
      {label}
    </div>
    {children}
  </div>
);

export default EpisodeEditModal;
