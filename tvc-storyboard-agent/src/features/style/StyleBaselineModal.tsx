import React, { useEffect, useRef, useState } from 'react';
import { useStyleBaselineStore } from '../../stores';
import type { StyleBaseline } from '../../stores';
import { useFocusTrap } from '../../components/useFocusTrap';
import { useEscapeKey } from '../../components/useEscapeKey';
import { useModalSave } from '../../components/useModalSave';
import { SealMark } from '../../components/Ornaments';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  visualStyle: string;
  colorTone: string;
  cinematography: string;
  era: string;
  costumeKeywords: string;
  notes: string;
}

function toForm(b: StyleBaseline): FormState {
  return {
    visualStyle: b.visualStyle,
    colorTone: b.colorTone,
    cinematography: b.cinematography,
    era: b.era,
    costumeKeywords: b.costumeKeywords.join('、'),
    notes: b.notes,
  };
}

function fromForm(f: FormState): StyleBaseline {
  const splitTags = (s: string) =>
    s
      .split(/[、,，\n]+/)
      .map((x) => x.trim())
      .filter(Boolean);
  return {
    visualStyle: f.visualStyle.trim(),
    colorTone: f.colorTone.trim(),
    cinematography: f.cinematography.trim(),
    era: f.era.trim(),
    costumeKeywords: splitTags(f.costumeKeywords),
    notes: f.notes.trim(),
  };
}

const PRESETS: Array<{ label: string; baseline: StyleBaseline }> = [
  {
    label: '90 年代农村怀旧',
    baseline: {
      visualStyle: '电影感写实，颗粒感胶片质感',
      colorTone: '暖黄怀旧，褪色泛黄',
      cinematography: '缓推 + 柔焦，长镜头叙事',
      era: '90 年代中国北方农村',
      costumeKeywords: ['粗布衣', '解放鞋', '蓝灰中山装', '煤油灯', '土炕', '搪瓷缸'],
      notes: '画面饱和度低，光线偏正午斜阳与油灯',
    },
  },
  {
    label: '动画日漫小清新',
    baseline: {
      visualStyle: '日式赛璐璐动画风，干净线条',
      colorTone: '高饱和明媚，蓝绿主调',
      cinematography: '正面中景为主，定格高光瞬间',
      era: '现代都市',
      costumeKeywords: ['校服', '帆布鞋', '清爽刘海'],
      notes: '人物表情夸张化，背景虚化',
    },
  },
  {
    label: '古风水墨写意',
    baseline: {
      visualStyle: '中国水墨写意，留白构图',
      colorTone: '青灰素雅，淡彩点染',
      cinematography: '远景大场面 + 特写交替，慢节奏',
      era: '古代不指定朝代',
      costumeKeywords: ['汉服', '布鞋', '油纸伞', '竹简'],
      notes: '画面强调诗意与意境，避免现代元素',
    },
  },
];

const StyleBaselineModal: React.FC<Props> = ({ open, onClose }) => {
  const baseline = useStyleBaselineStore((s) => s.baseline);
  const update = useStyleBaselineStore((s) => s.update);
  const reset = useStyleBaselineStore((s) => s.reset);

  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (open) setForm(toForm(baseline));
  }, [open, baseline]);

  const save = () => {
    if (!form) return;
    update(fromForm(form));
    onClose();
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useEscapeKey(open, onClose);
  useModalSave(open && !!form, save);
  useFocusTrap(open, containerRef);

  if (!open || !form) return null;

  const patch = (k: keyof FormState, v: string) =>
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev));

  const applyPreset = (b: StyleBaseline) => {
    setForm(toForm(b));
  };

  const clearAll = () => {
    if (!confirm('确认清空全片风格基线？')) return;
    reset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="scrollbar-thin max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-sepia-900/40 bg-ink-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="label-stamp text-[11px] text-sepia-400/70">
              全片风格基线
            </div>
            <h2 className="mt-0.5 flex items-center gap-2 text-lg font-semibold text-sepia-100 season-title">
              <SealMark size={14} className="text-sepia-500" />
              风格基线设定
            </h2>
            <div className="mt-1 text-[11px] text-ink-300">
              所有镜头出图、视频、封面 AI 调用都会自动注入这套基线，确保跨集风格一致。
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* 预设快选 */}
        <div className="mb-4 rounded-md border border-sepia-900/30 bg-sepia-950/10 p-3">
          <div className="mb-2 text-[11px] text-sepia-300/80">
            快速套用预设（会覆盖当前编辑值，保存后才生效）：
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.baseline)}
                type="button"
                className="rounded border border-sepia-800/50 bg-sepia-900/20 px-2 py-1 text-[11px] text-sepia-200 hover:border-sepia-700 hover:bg-sepia-900/40"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Field label="画风">
            <input
              type="text"
              value={form.visualStyle}
              onChange={(e) => patch('visualStyle', e.target.value)}
              placeholder="例：电影感写实，颗粒感胶片质感"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="色调">
              <input
                type="text"
                value={form.colorTone}
                onChange={(e) => patch('colorTone', e.target.value)}
                placeholder="例：暖黄怀旧，褪色泛黄"
                className={inputCls}
              />
            </Field>
            <Field label="时代背景">
              <input
                type="text"
                value={form.era}
                onChange={(e) => patch('era', e.target.value)}
                placeholder="例：90 年代中国北方农村"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="镜头语言">
            <input
              type="text"
              value={form.cinematography}
              onChange={(e) => patch('cinematography', e.target.value)}
              placeholder="例：缓推 + 柔焦，长镜头叙事"
              className={inputCls}
            />
          </Field>

          <Field label="服化道关键词（顿号、逗号或换行分隔）">
            <textarea
              value={form.costumeKeywords}
              onChange={(e) => patch('costumeKeywords', e.target.value)}
              rows={2}
              placeholder="例：粗布衣、解放鞋、蓝灰中山装、煤油灯、土炕"
              className={textareaCls}
            />
          </Field>

          <Field label="备注（其它跨镜头共享的画面约束）">
            <textarea
              value={form.notes}
              onChange={(e) => patch('notes', e.target.value)}
              rows={2}
              placeholder="例：画面饱和度低，光线偏正午斜阳与油灯"
              className={textareaCls}
            />
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-neutral-800 pt-4">
          <button
            onClick={clearAll}
            className="rounded border border-red-900/50 px-3 py-1.5 text-xs text-red-300 hover:border-red-800 hover:bg-red-950/20"
            type="button"
          >
            清空基线
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-700"
              type="button"
            >
              取消
            </button>
            <button
              onClick={save}
              className="rounded bg-sepia-700 px-3 py-1.5 text-xs font-medium text-sepia-50 hover:bg-sepia-600"
              type="button"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputCls =
  'w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-sepia-700 focus:outline-none';
const textareaCls =
  'w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-sepia-700 focus:outline-none';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <div className="label-stamp mb-1 text-[11px] text-sepia-400/70">
      {label}
    </div>
    {children}
  </div>
);

export default StyleBaselineModal;
