import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, RotateCcw, Save } from 'lucide-react';
import { useShotStore } from '../../stores';
import { toast } from '../../stores/toastStore';

interface Props {
  shotId: string;
  srt: string;
  /** 镜头实际时长，用于校验 cue 不超出 */
  shotDuration: number;
}

interface Cue {
  /** 1-based 序号 */
  index: number;
  /** 起始毫秒 */
  startMs: number;
  /** 结束毫秒 */
  endMs: number;
  text: string;
}

const MS_PATTERN = /^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/;

function parseTime(input: string): number | null {
  const m = input.trim().match(MS_PATTERN);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const s = Number(m[3]);
  const ms = Number(m[4]!.padEnd(3, '0').slice(0, 3));
  if (min >= 60 || s >= 60) return null;
  return h * 3600_000 + min * 60_000 + s * 1000 + ms;
}

function formatTime(totalMs: number): string {
  if (totalMs < 0) totalMs = 0;
  const h = Math.floor(totalMs / 3600_000);
  const min = Math.floor((totalMs % 3600_000) / 60_000);
  const s = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(
    s
  ).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function parseSrt(input: string): Cue[] {
  if (!input.trim()) return [];
  const blocks = input.replace(/\r\n/g, '\n').trim().split(/\n{2,}/);
  const cues: Cue[] = [];
  blocks.forEach((block, blockIdx) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    // 第一行通常是序号；如果不是数字，当作文本
    let cursor = 0;
    let index = blockIdx + 1;
    if (/^\d+$/.test(lines[0]!)) {
      index = Number(lines[0]);
      cursor = 1;
    }
    const timeLine = lines[cursor];
    if (!timeLine) return;
    const tm = timeLine.split(/\s*-->\s*/);
    if (tm.length !== 2) return;
    const startMs = parseTime(tm[0]!);
    const endMs = parseTime(tm[1]!);
    if (startMs === null || endMs === null) return;
    const text = lines.slice(cursor + 1).join('\n');
    cues.push({ index, startMs, endMs, text });
  });
  return cues;
}

function serializeSrt(cues: Cue[]): string {
  return cues
    .map(
      (c, i) =>
        `${i + 1}\n${formatTime(c.startMs)} --> ${formatTime(c.endMs)}\n${c.text}`
    )
    .join('\n\n');
}

const SubtitleEditor: React.FC<Props> = ({ shotId, srt, shotDuration }) => {
  const setSubtitle = useShotStore((s) => s.setSubtitle);
  const [cues, setCues] = useState<Cue[]>(() => parseSrt(srt));
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  // 外部 srt 变化时重置
  useEffect(() => {
    setCues(parseSrt(srt));
    setDirty(false);
  }, [srt]);

  const totalMs = shotDuration * 1000;

  const issues = useMemo(() => {
    const out: string[] = [];
    cues.forEach((c, i) => {
      if (c.endMs <= c.startMs) out.push(`第 ${i + 1} 条：结束时间需 > 起始时间`);
      if (c.endMs > totalMs + 200)
        out.push(`第 ${i + 1} 条：结束 ${formatTime(c.endMs)} 超出镜头时长 ${shotDuration}s`);
      if (i > 0 && c.startMs < cues[i - 1]!.endMs)
        out.push(`第 ${i + 1} 条：起始时间早于上一条结束时间，会重叠`);
    });
    return out;
  }, [cues, totalMs, shotDuration]);

  const updateCue = (idx: number, patch: Partial<Cue>) => {
    setCues((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
    setDirty(true);
  };

  const addCue = () => {
    const last = cues[cues.length - 1];
    const startMs = last ? Math.min(last.endMs, totalMs - 500) : 0;
    const endMs = Math.min(startMs + 1500, totalMs);
    setCues((prev) => [
      ...prev,
      { index: prev.length + 1, startMs, endMs, text: '' },
    ]);
    setDirty(true);
  };

  const removeCue = (idx: number) => {
    setCues((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const save = () => {
    if (issues.length > 0) {
      if (!confirm(`有 ${issues.length} 条警告，仍然保存？\n\n${issues.slice(0, 3).join('\n')}`))
        return;
    }
    const srtOut = serializeSrt(cues);
    setSubtitle(shotId, srtOut);
    setDirty(false);
    toast.success(`字幕已保存 · ${cues.length} 条`);
  };

  const reset = () => {
    if (dirty && !confirm('放弃当前编辑，恢复到原始字幕？')) return;
    setCues(parseSrt(srt));
    setDirty(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        type="button"
        className="rounded border border-sepia-800/60 bg-sepia-900/20 px-2 py-0.5 text-[10px] text-sepia-200 hover:border-sepia-700 hover:bg-sepia-900/40"
        title="打开字幕编辑器，逐条调整文字与时间戳"
      >
        编辑字幕
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-sepia-900/40 bg-ink-900/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="label-stamp text-[10px] text-sepia-400/70">
          字幕编辑器 · {cues.length} 条
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={addCue}
            type="button"
            className="flex items-center gap-0.5 rounded border border-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300 hover:border-sepia-700 hover:text-sepia-200"
            title="添加一条字幕"
          >
            <Plus size={10} /> 添加
          </button>
          <button
            onClick={reset}
            type="button"
            disabled={!dirty}
            className="flex items-center gap-0.5 rounded border border-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300 hover:border-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
            title="放弃编辑"
          >
            <RotateCcw size={10} /> 重置
          </button>
          <button
            onClick={save}
            type="button"
            disabled={!dirty}
            className="flex items-center gap-0.5 rounded bg-sepia-700 px-2 py-0.5 text-[10px] font-medium text-sepia-50 hover:bg-sepia-600 disabled:cursor-not-allowed disabled:opacity-40"
            title="保存到镜头"
          >
            <Save size={10} /> 保存
          </button>
          <button
            onClick={() => setOpen(false)}
            type="button"
            className="rounded px-1.5 py-0.5 text-[10px] text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
            title="关闭编辑器"
          >
            ✕
          </button>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="mb-2 rounded border border-amber-900/50 bg-amber-950/20 p-1.5 text-[10px] text-amber-300">
          {issues.map((s, i) => (
            <div key={i}>⚠️ {s}</div>
          ))}
        </div>
      )}

      {cues.length === 0 ? (
        <div className="rounded border border-dashed border-neutral-800 p-4 text-center text-[11px] text-neutral-500">
          字幕为空。点「+ 添加」插入一条。
        </div>
      ) : (
        <div className="scrollbar-thin max-h-72 space-y-1.5 overflow-y-auto">
          {cues.map((c, i) => (
            <CueRow
              key={i}
              cue={c}
              onChange={(patch) => updateCue(i, patch)}
              onRemove={() => removeCue(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CueRow: React.FC<{
  cue: Cue;
  onChange: (patch: Partial<Cue>) => void;
  onRemove: () => void;
}> = ({ cue, onChange, onRemove }) => {
  const [startStr, setStartStr] = useState(formatTime(cue.startMs));
  const [endStr, setEndStr] = useState(formatTime(cue.endMs));

  // 外部 ms 变化（reset / 保存往回写）时同步显示
  useEffect(() => setStartStr(formatTime(cue.startMs)), [cue.startMs]);
  useEffect(() => setEndStr(formatTime(cue.endMs)), [cue.endMs]);

  const commitStart = () => {
    const ms = parseTime(startStr);
    if (ms === null) {
      setStartStr(formatTime(cue.startMs));
      toast.warning('时间格式不合法，已恢复（应为 HH:MM:SS,mmm）');
    } else if (ms !== cue.startMs) {
      onChange({ startMs: ms });
    }
  };
  const commitEnd = () => {
    const ms = parseTime(endStr);
    if (ms === null) {
      setEndStr(formatTime(cue.endMs));
      toast.warning('时间格式不合法，已恢复（应为 HH:MM:SS,mmm）');
    } else if (ms !== cue.endMs) {
      onChange({ endMs: ms });
    }
  };

  return (
    <div className="rounded border border-neutral-800 bg-neutral-900/50 p-1.5">
      <div className="flex items-center gap-1 mb-1">
        <input
          type="text"
          value={startStr}
          onChange={(e) => setStartStr(e.target.value)}
          onBlur={commitStart}
          className="w-28 rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] text-neutral-200 focus:border-sepia-700 focus:outline-none"
          title="起始时间 HH:MM:SS,mmm"
        />
        <span className="text-[10px] text-neutral-600">→</span>
        <input
          type="text"
          value={endStr}
          onChange={(e) => setEndStr(e.target.value)}
          onBlur={commitEnd}
          className="w-28 rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] text-neutral-200 focus:border-sepia-700 focus:outline-none"
          title="结束时间 HH:MM:SS,mmm"
        />
        <span className="ml-1 text-[10px] text-neutral-500">
          {((cue.endMs - cue.startMs) / 1000).toFixed(2)}s
        </span>
        <button
          onClick={onRemove}
          type="button"
          className="ml-auto rounded p-0.5 text-neutral-500 hover:bg-red-950/40 hover:text-red-300"
          title="删除此条"
        >
          <Trash2 size={10} />
        </button>
      </div>
      <textarea
        value={cue.text}
        onChange={(e) => onChange({ text: e.target.value })}
        rows={2}
        className="w-full rounded border border-neutral-800 bg-neutral-950/60 px-2 py-1 text-[11px] text-neutral-100 placeholder:text-neutral-600 focus:border-sepia-700 focus:outline-none"
        placeholder="字幕文本（可多行）"
      />
    </div>
  );
};

export default SubtitleEditor;
