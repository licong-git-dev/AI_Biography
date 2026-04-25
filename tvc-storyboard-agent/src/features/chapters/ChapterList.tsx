import React, { useRef, useState } from 'react';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useChapterStore, useEpisodeStore, useUIStore } from '../../stores';
import type { Episode } from '../../types';
import { splitManyChapters } from './chapterService';
import { ApiKeyMissingError } from '../../services/geminiClient';
import { isAbortError } from '../../services/abort';
import { toast } from '../../stores/toastStore';
import Spinner from '../../components/Spinner';

interface Props {
  onSelect: (id: string) => void;
}

const ChapterList: React.FC<Props> = ({ onSelect }) => {
  const chapters = useChapterStore((s) => s.chapters);
  const loading = useChapterStore((s) => s.loading);
  const error = useChapterStore((s) => s.error);
  const reloadChapters = useChapterStore((s) => s.load);

  const addMany = useEpisodeStore((s) => s.addMany);
  const nextEpisodeNumber = useEpisodeStore((s) => s.nextEpisodeNumber);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);
  const setCenterTab = useUIStore((s) => s.setCenterTab);

  const [batchTarget, setBatchTarget] = useState(3);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    done: number;
    total: number;
    currentTitle: string | null;
  } | null>(null);
  const [batchSummary, setBatchSummary] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleBatch = async () => {
    if (chapters.length === 0) return;
    const perChapterCalls = 1;
    const total = chapters.length;
    const estimatedTimeMin = Math.ceil((total * 20) / 60); // 每章约 15-25s
    if (
      !confirm(
        `批量拆集 ${total} 章，每章约 ${batchTarget} 集。
• 共约 ${total * perChapterCalls} 次 AI 调用
• 预计耗时 ${estimatedTimeMin} 分钟（平均每章 20 秒）
• 若某章已有生成的集数，新拆出的会追加在后面，不会删除旧的

继续？`
      )
    ) {
      return;
    }

    setBatchSummary(null);
    setBatchRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    setBatchProgress({ done: 0, total, currentTitle: null });

    let done = 0;
    try {
      const result = await splitManyChapters({
        chapters,
        targetPerChapter: batchTarget,
        signal: controller.signal,
        onStart: (chapterId) => {
          const ch = chapters.find((c) => c.id === chapterId);
          setBatchProgress({ done, total, currentTitle: ch?.title ?? null });
        },
        onSuccess: (chapterId, proposals) => {
          const ch = chapters.find((c) => c.id === chapterId);
          if (!ch) return;
          let n = nextEpisodeNumber(1);
          const newEpisodes: Episode[] = proposals.map((p) => {
            const ep: Episode = {
              id: `ep-s1-${String(n).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6)}`,
              seasonNumber: 1,
              episodeNumber: n,
              title: p.title,
              sourceChapters: [ch.number],
              mainConflict: p.mainConflict,
              memoryPoints: p.memoryPoints,
              platformSellingPoint: p.platformSellingPoint,
              priority: p.priority,
              format: p.format,
              targetDuration: p.targetDuration,
              status: '规划中',
              hook: p.hook,
              climax: p.climax,
              suspense: p.suspense,
            };
            n += 1;
            return ep;
          });
          addMany(newEpisodes);
          done += 1;
          setBatchProgress({ done, total, currentTitle: null });
        },
        onFailure: (_id, err) => {
          done += 1;
          setBatchProgress({ done, total, currentTitle: null });
          toast.error(`一章拆集失败：${err.slice(0, 50)}`);
        },
      });

      if (result.aborted) {
        setBatchSummary(
          `已中止：${result.successCount} 章成功 · ${result.failCount} 章失败`
        );
      } else {
        setBatchSummary(
          `完成：${result.successCount} 章成功 · ${result.failCount} 章失败。已切到集数 tab 查看。`
        );
        if (result.successCount > 0) setCenterTab('episodes');
      }
    } catch (e) {
      if (isAbortError(e)) {
        setBatchSummary('已中止');
      } else if (e instanceof ApiKeyMissingError) {
        openApiKey();
        setBatchSummary('未配置 API Key');
      } else {
        setBatchSummary(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBatchRunning(false);
      setBatchProgress(null);
      abortRef.current = null;
    }
  };

  if (loading && chapters.length === 0) {
    return (
      <div className="rounded border border-neutral-800 bg-neutral-900/40 p-6 text-center text-sm text-neutral-500">
        加载章节中…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-900/50 bg-red-950/20 p-4 text-sm">
        <div className="mb-2 flex items-center gap-2 text-red-300">
          <AlertCircle size={14} />
          <span className="font-medium">章节加载失败</span>
        </div>
        <div className="mb-3 text-[11px] text-red-400/80">{error}</div>
        <div className="text-[11px] text-neutral-500 mb-3">
          可能是网络抖动 / public/data/ 路径出错 / 路由配置问题。
        </div>
        <button
          onClick={() => void reloadChapters()}
          className="flex items-center gap-1.5 rounded border border-red-800 bg-red-950/40 px-3 py-1.5 text-xs text-red-200 hover:border-red-700"
          type="button"
        >
          <RefreshCw size={11} />
          重试加载
        </button>
      </div>
    );
  }

  if (!loading && chapters.length === 0) {
    return (
      <div className="rounded border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-300">
        章节列表为空。可能是 public/data/chapters/*.md 没就位。
        <button
          onClick={() => void reloadChapters()}
          className="ml-2 rounded border border-amber-800 px-2 py-0.5 text-[11px] hover:border-amber-700"
          type="button"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 批量拆集条 */}
      <div className="mb-3 rounded-lg border border-sky-900/40 bg-sky-950/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-sky-200">
              <Sparkles size={11} /> 批量拆集
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-400">
              一次对全部 {chapters.length} 章跑 AI 拆集，省去逐章点击
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-neutral-400">每章</label>
            <select
              value={batchTarget}
              onChange={(e) => setBatchTarget(Number(e.target.value))}
              disabled={batchRunning}
              className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-[11px] text-neutral-100 disabled:opacity-50"
            >
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} 集
                </option>
              ))}
            </select>
            {batchRunning && (
              <button
                onClick={() => abortRef.current?.abort()}
                className="rounded border border-red-800 bg-red-950/30 px-2 py-0.5 text-[11px] text-red-300 hover:border-red-700"
                type="button"
              >
                中止
              </button>
            )}
            <button
              onClick={handleBatch}
              disabled={batchRunning}
              className="flex items-center gap-1 rounded bg-sky-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {batchRunning && <Spinner size={10} />}
              {batchRunning && batchProgress
                ? `拆集中 ${batchProgress.done}/${batchProgress.total}…`
                : batchRunning
                  ? '拆集中…'
                  : `一键拆全部 ${chapters.length} 章`}
            </button>
          </div>
        </div>
        {batchProgress?.currentTitle && (
          <div className="mt-2 text-[10px] text-sky-300">
            正在处理：第 {chapters.find((c) => c.title === batchProgress.currentTitle)?.number} 章《
            {batchProgress.currentTitle}》
          </div>
        )}
        {batchSummary && (
          <div className="mt-2 rounded border border-neutral-800 bg-neutral-900/60 p-1.5 text-[10px] text-neutral-300">
            {batchSummary}
          </div>
        )}
      </div>

      {/* 章节卡片 */}
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
    </div>
  );
};

export default ChapterList;
