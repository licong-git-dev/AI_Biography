import React, { useEffect, useRef, useState } from 'react';
import type {
  CameraMove,
  GenMethod,
  Shot,
  ShotSize,
} from '../../types';
import { useCharacterStore, useShotStore } from '../../stores';
import { useEscapeKey } from '../../components/useEscapeKey';
import { useModalSave } from '../../components/useModalSave';
import { useFocusTrap } from '../../components/useFocusTrap';

interface Props {
  shotId: string | null;
  open: boolean;
  onClose: () => void;
}

const SHOT_SIZES: ShotSize[] = [
  '特写',
  '近景',
  '中景',
  '中近景',
  '全景',
  '远景',
  '大远景',
  '蒙太奇',
  '黑场/特写',
];

const CAMERA_MOVES: (CameraMove | '')[] = [
  '',
  '推',
  '拉',
  '摇',
  '移',
  '跟',
  '升降',
  '固定',
  '后拉',
];

const GEN_METHODS: GenMethod[] = [
  '关键帧',
  '关键帧 + 缓推',
  '关键帧 + 微动效',
  '图生视频',
  '图生视频/航拍感',
  '图生视频/后拉',
  '静图组接',
  '静图组接 + 窗外运动',
  '特写图生视频 + 静图',
  'Remotion 字幕卡点',
];

interface FormState {
  number: string;
  duration: string;
  shotSize: ShotSize;
  cameraMove: CameraMove | '';
  description: string;
  characters: string[];
  narration: string;
  dialogue: string;
  audioNotes: string;
  genMethod: GenMethod;
  prompt: string;
}

function toForm(s: Shot): FormState {
  return {
    number: s.number,
    duration: String(s.duration),
    shotSize: s.shotSize,
    cameraMove: s.cameraMove ?? '',
    description: s.description,
    characters: s.characters,
    narration: s.narration ?? '',
    dialogue: s.dialogue ?? '',
    audioNotes: s.audioNotes,
    genMethod: s.genMethod,
    prompt: s.prompt ?? '',
  };
}

function fromForm(f: FormState): Partial<Shot> {
  const parsed = parseInt(f.duration, 10);
  return {
    number: f.number.trim() || '00',
    duration: Number.isFinite(parsed) ? parsed : 0,
    shotSize: f.shotSize,
    cameraMove: f.cameraMove === '' ? undefined : (f.cameraMove as CameraMove),
    description: f.description.trim(),
    characters: f.characters,
    narration: f.narration.trim() || undefined,
    dialogue: f.dialogue.trim() || undefined,
    audioNotes: f.audioNotes.trim(),
    genMethod: f.genMethod,
    prompt: f.prompt.trim() || undefined,
  };
}

const ShotEditModal: React.FC<Props> = ({ shotId, open, onClose }) => {
  const shot = useShotStore((s) => (shotId ? s.getById(shotId) : undefined));
  const update = useShotStore((s) => s.update);
  const characters = useCharacterStore((s) => s.characters);

  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (open && shot) setForm(toForm(shot));
  }, [open, shot]);

  const save = () => {
    if (!shot || !form) return;
    update(shot.id, fromForm(form));
    onClose();
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useEscapeKey(open, onClose);
  useModalSave(open && !!form, save);
  useFocusTrap(open, containerRef);

  if (!open || !shot || !form) return null;

  const patch = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev));

  const toggleCharacter = (id: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = prev.characters.includes(id)
        ? prev.characters.filter((c) => c !== id)
        : [...prev.characters, id];
      return { ...prev, characters: next };
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        ref={containerRef}
        className="scrollbar-thin max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              编辑镜头信息
            </div>
            <h2 className="mt-0.5 font-mono text-lg font-semibold text-neutral-100">
              {shot.number}
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
          <div className="grid grid-cols-4 gap-3">
            <Field label="镜号">
              <input
                type="text"
                value={form.number}
                onChange={(e) => patch('number', e.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 font-mono text-sm text-neutral-100"
              />
            </Field>
            <Field label="时长（秒）">
              <input
                type="number"
                min={0}
                value={form.duration}
                onChange={(e) => patch('duration', e.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
              />
            </Field>
            <Field label="景别">
              <select
                value={form.shotSize}
                onChange={(e) => patch('shotSize', e.target.value as ShotSize)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
              >
                {SHOT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="运镜">
              <select
                value={form.cameraMove}
                onChange={(e) =>
                  patch('cameraMove', e.target.value as CameraMove | '')
                }
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
              >
                {CAMERA_MOVES.map((c) => (
                  <option key={c} value={c}>
                    {c || '（空）'}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="画面描述">
            <textarea
              value={form.description}
              onChange={(e) => patch('description', e.target.value)}
              rows={3}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            />
          </Field>

          <Field label="出场角色（可多选）">
            <div className="flex flex-wrap gap-1.5">
              {characters.map((c) => {
                const on = form.characters.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCharacter(c.id)}
                    type="button"
                    className={`rounded border px-2 py-1 text-[11px] transition ${
                      on
                        ? 'border-sky-700 bg-sky-900/40 text-sky-200'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
              {characters.length === 0 && (
                <span className="text-[11px] text-neutral-600 italic">
                  还没有角色
                </span>
              )}
              {form.characters
                .filter((id) => !characters.some((c) => c.id === id))
                .map((id) => (
                  <button
                    key={id}
                    onClick={() => toggleCharacter(id)}
                    type="button"
                    className="rounded border border-red-800 bg-red-950/30 px-2 py-1 text-[11px] text-red-300 hover:border-red-700"
                    title="角色已被删除，点击移除引用"
                  >
                    孤儿 {id} ×
                  </button>
                ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="旁白">
              <textarea
                value={form.narration}
                onChange={(e) => patch('narration', e.target.value)}
                rows={2}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
              />
            </Field>
            <Field label="对白">
              <textarea
                value={form.dialogue}
                onChange={(e) => patch('dialogue', e.target.value)}
                rows={2}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
              />
            </Field>
          </div>

          <Field label="声音 / 环境音描述">
            <input
              type="text"
              value={form.audioNotes}
              onChange={(e) => patch('audioNotes', e.target.value)}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            />
          </Field>

          <Field label="生成方式">
            <select
              value={form.genMethod}
              onChange={(e) => patch('genMethod', e.target.value as GenMethod)}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            >
              {GEN_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          <Field label="图像生成提示词（AI 自动填；可手动微调后重生）">
            <textarea
              value={form.prompt}
              onChange={(e) => patch('prompt', e.target.value)}
              rows={6}
              placeholder="通常由 AI 基于镜头信息 + 角色基线自动拼出；手动编辑会覆盖自动生成内容。"
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-[11px] leading-relaxed text-neutral-200 focus:border-neutral-500 focus:outline-none"
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

export default ShotEditModal;
