import React from 'react';
import { useChapterStore } from '../../stores';

interface Props {
  onSelect: (id: string) => void;
}

const ChapterList: React.FC<Props> = ({ onSelect }) => {
  const chapters = useChapterStore((s) => s.chapters);
  const loading = useChapterStore((s) => s.loading);
  const error = useChapterStore((s) => s.error);

  if (loading && chapters.length === 0) {
    return (
      <div className="rounded border border-neutral-800 bg-neutral-900/40 p-6 text-center text-sm text-neutral-500">
        加载章节中…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400">
        加载失败：{error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chapters.map((ch) => (
        <button
          key={ch.id}
          onClick={() => onSelect(ch.id)}
          className="flex w-full items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 text-left transition hover:border-neutral-700"
          type="button"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-neutral-500">
                第 {ch.number} 章
              </span>
              <span className="text-sm font-medium text-neutral-100">
                《{ch.title}》
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-500">
              {ch.wordCount.toLocaleString()} 字
            </div>
          </div>
          <span className="shrink-0 text-xs text-neutral-600">查看 →</span>
        </button>
      ))}
    </div>
  );
};

export default ChapterList;
