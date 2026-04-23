import React, { useEffect, useState } from 'react';
import type { Character } from '../../types';
import { useCharacterStore } from '../../stores';

interface Props {
  characterId: string | null;
  open: boolean;
  onClose: () => void;
}

interface FormState {
  name: string;
  positioning: string;
  appearance: string;
  vibe: string;
  outfits: string;
  inheritedTraits: string;
  promptBaseline: string;
  voiceNotes: string;
}

function toForm(c: Character): FormState {
  return {
    name: c.name,
    positioning: c.positioning,
    appearance: c.appearance.join('\n'),
    vibe: c.vibe.join('、'),
    outfits: c.outfits.join('\n'),
    inheritedTraits: (c.inheritedTraits ?? []).join('\n'),
    promptBaseline: c.promptBaseline,
    voiceNotes: c.voiceNotes.join('\n'),
  };
}

function fromForm(f: FormState): Partial<Character> {
  const splitLines = (s: string) =>
    s.split('\n').map((x) => x.trim()).filter(Boolean);
  const splitTags = (s: string) =>
    s
      .split(/[、,，]+/)
      .map((x) => x.trim())
      .filter(Boolean);

  const inherited = splitLines(f.inheritedTraits);
  return {
    name: f.name.trim(),
    positioning: f.positioning.trim(),
    appearance: splitLines(f.appearance),
    vibe: splitTags(f.vibe),
    outfits: splitLines(f.outfits),
    inheritedTraits: inherited.length > 0 ? inherited : undefined,
    promptBaseline: f.promptBaseline.trim(),
    voiceNotes: splitLines(f.voiceNotes),
  };
}

const CharacterEditModal: React.FC<Props> = ({ characterId, open, onClose }) => {
  const character = useCharacterStore((s) =>
    characterId ? s.getById(characterId) : undefined
  );
  const update = useCharacterStore((s) => s.update);

  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (open && character) setForm(toForm(character));
  }, [open, character]);

  if (!open || !character || !form) return null;

  const patch = (k: keyof FormState, v: string) =>
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev));

  const save = () => {
    update(character.id, fromForm(form));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="scrollbar-thin max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              {character.group} · {character.ageStage} · {character.ageRange}
            </div>
            <h2 className="mt-0.5 text-lg font-semibold text-neutral-100">
              编辑角色卡
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
          <Field label="名称">
            <input
              type="text"
              value={form.name}
              onChange={(e) => patch('name', e.target.value)}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </Field>

          <Field label="角色定位">
            <textarea
              value={form.positioning}
              onChange={(e) => patch('positioning', e.target.value)}
              rows={2}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </Field>

          <Field label="外观基线（每行一条）">
            <textarea
              value={form.appearance}
              onChange={(e) => patch('appearance', e.target.value)}
              rows={6}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </Field>

          <Field label="气质关键词（用「、」分隔）">
            <input
              type="text"
              value={form.vibe}
              onChange={(e) => patch('vibe', e.target.value)}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </Field>

          <Field label="常用服装组（每行一条）">
            <textarea
              value={form.outfits}
              onChange={(e) => patch('outfits', e.target.value)}
              rows={4}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </Field>

          <Field label="继承特征（每行一条，选填）">
            <textarea
              value={form.inheritedTraits}
              onChange={(e) => patch('inheritedTraits', e.target.value)}
              rows={3}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </Field>

          <Field label="画面提示词基线（英文）">
            <textarea
              value={form.promptBaseline}
              onChange={(e) => patch('promptBaseline', e.target.value)}
              rows={3}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </Field>

          <Field label="声音建议（每行一条）">
            <textarea
              value={form.voiceNotes}
              onChange={(e) => patch('voiceNotes', e.target.value)}
              rows={3}
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

export default CharacterEditModal;
