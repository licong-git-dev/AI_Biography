import React from 'react';
import { useChapterStore } from '../../stores';

interface Props {
  chapterId: string;
  onBack: () => void;
}

const ChapterDetail: React.FC<Props> = ({ chapterId, onBack }) => {
  const chapter = useChapterStore((s) => s.getById(chapterId));

  if (!chapter) {
    return (
      <div className="rounded border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-500">
        章节不存在
        <button
          onClick={onBack}
          className="ml-3 text-sky-400 underline underline-offset-2"
          type="button"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-xs text-neutral-400 hover:text-neutral-200"
        type="button"
      >
        ← 返回章节列表
      </button>

      <div className="mb-4 border-b border-neutral-800 pb-3">
        <div className="font-mono text-xs text-neutral-500">
          第 {chapter.number} 章 · {chapter.wordCount.toLocaleString()} 字
        </div>
        <h2 className="mt-1 text-lg font-semibold text-neutral-100">
          《{chapter.title}》
        </h2>
      </div>

      <article className="scrollbar-thin max-h-[calc(100vh-200px)] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
        {chapter.content}
      </article>

      <div className="mt-4 border-t border-neutral-800 pt-3 text-[11px] text-neutral-600">
        Phase 4 将在此处加「拆集」AI 操作 → 自动产出 2–3 集短剧集。
      </div>
    </div>
  );
};

export default ChapterDetail;
