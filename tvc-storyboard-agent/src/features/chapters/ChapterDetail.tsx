import React, { useRef, useState } from 'react';
import { BookmarkPlus, Quote } from 'lucide-react';
import {
  useChapterStore,
  useEpisodeStore,
  useLibraryStore,
  useUIStore,
} from '../../stores';
import type { Episode } from '../../types';
import {
  splitChapterIntoEpisodes,
  generateContentMatrix,
  type GeneratedEpisode,
  type ContentMatrixItem,
} from './chapterService';
import type { EpisodeFormat } from '../../types';
import {
  extractPunchlines,
  type PunchlineCandidate,
} from './punchlineService';
import EmotionArcViz from './EmotionArcViz';
import {
  ChapterHeadingOrnament,
  CornerFlourish,
} from '../../components/Ornaments';
import { ApiKeyMissingError } from '../../services/geminiClient';
import { humanizeError } from '../../services/errorMessages';
import { toast } from '../../stores/toastStore';
import Spinner from '../../components/Spinner';

interface Props {
  chapterId: string;
  onBack: () => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  S: 'bg-red-900/40 text-red-300 border-red-800/50',
  A: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
  'A-': 'bg-amber-900/20 text-amber-400 border-amber-800/30',
  B: 'bg-neutral-800 text-neutral-400 border-neutral-700',
};

const ChapterDetail: React.FC<Props> = ({ chapterId, onBack }) => {
  const chapter = useChapterStore((s) => s.getById(chapterId));
  const nextEpisodeNumber = useEpisodeStore((s) => s.nextEpisodeNumber);
  const addMany = useEpisodeStore((s) => s.addMany);
  const setCenterTab = useUIStore((s) => s.setCenterTab);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);

  const [targetCount, setTargetCount] = useState(3);
  const [proposals, setProposals] = useState<GeneratedEpisode[] | null>(null);
  const [matrix, setMatrix] = useState<ContentMatrixItem[] | null>(null);
  const [matrixBusy, setMatrixBusy] = useState(false);
  const matrixAbortRef = useRef<AbortController | null>(null);

  const addLibraryHook = useLibraryStore((s) => s.addHook);
  const [punchlines, setPunchlines] = useState<PunchlineCandidate[] | null>(
    null
  );
  const [punchlineBusy, setPunchlineBusy] = useState(false);
  const [punchlineError, setPunchlineError] = useState<string | null>(null);
  const punchAbortRef = useRef<AbortController | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSplit = async () => {
    setError(null);
    setGenerating(true);
    setProposals(null);
    setMatrix(null);
    try {
      const result = await splitChapterIntoEpisodes(chapter, targetCount);
      setProposals(result);
    } catch (e) {
      const h = humanizeError(e);
      if (e instanceof ApiKeyMissingError) openApiKey();
      setError(h.aborted ? '已取消' : h.hint ? `${h.title}\n${h.hint}` : h.title);
    } finally {
      setGenerating(false);
    }
  };

  const handleMatrix = async () => {
    setError(null);
    setProposals(null);
    setMatrix(null);
    setMatrixBusy(true);
    const controller = new AbortController();
    matrixAbortRef.current = controller;
    try {
      const result = await generateContentMatrix(
        chapter,
        targetCount,
        ['A-主剧情', 'B-爆点切片', 'C-人物支线', 'D-金句旁白'],
        controller.signal
      );
      setMatrix(result);
      const ok = result.filter((m) => !m.error).length;
      const fail = result.length - ok;
      if (fail > 0) toast.warning(`矩阵生成完成：${ok} 成 / ${fail} 败，可单独重试`);
      else toast.success(`矩阵 4 版同生成完成 · 共 ${result.reduce((n, m) => n + m.episodes.length, 0)} 集候选`);
    } catch (e) {
      const h = humanizeError(e);
      if (e instanceof ApiKeyMissingError) openApiKey();
      setError(h.aborted ? '已取消' : h.hint ? `${h.title}\n${h.hint}` : h.title);
    } finally {
      setMatrixBusy(false);
      matrixAbortRef.current = null;
    }
  };

  const cancelMatrix = () => matrixAbortRef.current?.abort();

  const saveMatrixGroup = (item: ContentMatrixItem) => {
    if (item.episodes.length === 0) return;
    let n = nextEpisodeNumber(1);
    const newEpisodes: Episode[] = item.episodes.map((p) => {
      const ep: Episode = {
        id: `ep-s1-${String(n).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6)}`,
        seasonNumber: 1,
        episodeNumber: n,
        title: p.title,
        sourceChapters: [chapter.number],
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
    toast.success(`已保存 ${item.format} · ${newEpisodes.length} 集`);
    // 移除该格式，剩余的仍可继续保存
    setMatrix((prev) =>
      prev ? prev.filter((m) => m.format !== item.format) : null
    );
  };

  const handleExtractPunchlines = async () => {
    if (!chapter) return;
    setPunchlineError(null);
    setPunchlines(null);
    setPunchlineBusy(true);
    const controller = new AbortController();
    punchAbortRef.current = controller;
    try {
      const result = await extractPunchlines(chapter, 8, controller.signal);
      setPunchlines(result);
    } catch (e) {
      const h = humanizeError(e);
      if (e instanceof ApiKeyMissingError) openApiKey();
      setPunchlineError(
        h.aborted ? '已取消' : h.hint ? `${h.title}\n${h.hint}` : h.title
      );
    } finally {
      setPunchlineBusy(false);
      punchAbortRef.current = null;
    }
  };

  const saveToLibrary = (p: PunchlineCandidate) => {
    addLibraryHook({
      text: p.text,
      style: p.mood,
      why: p.why,
    });
    toast.success(`已收藏到资产库：${p.text.slice(0, 12)}…`);
  };

  const handleSaveAll = () => {
    if (!proposals) return;
    let n = nextEpisodeNumber(1);
    const newEpisodes: Episode[] = proposals.map((p) => {
      const ep: Episode = {
        id: `ep-s1-${String(n).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6)}`,
        seasonNumber: 1,
        episodeNumber: n,
        title: p.title,
        sourceChapters: [chapter.number],
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
    setProposals(null);
    setCenterTab('episodes');
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-xs text-neutral-400 hover:text-neutral-200"
        type="button"
      >
        ← 返回章节列表
      </button>

      <div className="mb-4 pb-3 text-center">
        <div className="font-mono text-[11px] tracking-[0.2em] text-sepia-400/70">
          第 {chapter.number} 章 · {chapter.wordCount.toLocaleString()} 字
        </div>
        <h2 className="season-title mt-1.5 text-2xl text-sepia-100">
          {chapter.title}
        </h2>
        <ChapterHeadingOrnament className="mt-2 text-sepia-600/60" />
      </div>

      {/* AI 拆集 控制区 */}
      <div className="mb-4 rounded-lg border border-sky-900/40 bg-sky-950/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-neutral-200">
              AI 拆集
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-500">
              把本章拆成可独立成立的短剧集（带钩子 / 高潮 / 悬念）
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-neutral-400">目标集数</label>
            <select
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-100"
              disabled={generating || matrixBusy}
            >
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              onClick={handleSplit}
              disabled={generating || matrixBusy}
              className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              title="按 A-主剧情 格式拆 1 套"
            >
              {generating ? '拆集中…（15-30 秒）' : 'AI 拆集'}
            </button>
            {matrixBusy && (
              <button
                onClick={cancelMatrix}
                className="rounded border border-red-800 bg-red-950/30 px-2 py-1 text-[11px] text-red-300 hover:border-red-700"
                type="button"
              >
                取消
              </button>
            )}
            <button
              onClick={handleMatrix}
              disabled={generating || matrixBusy}
              className="flex items-center gap-1 rounded border border-sepia-700 bg-sepia-800/40 px-3 py-1 text-xs font-medium text-sepia-100 hover:bg-sepia-700/60 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              title="并行生成 4 版剧集：主剧情 / 爆点 / 人物 / 金句 — 用于多平台分发与人群覆盖"
            >
              {matrixBusy ? <Spinner size={10} /> : null}
              {matrixBusy ? '矩阵生成中…' : '内容矩阵 4 版'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
            {error}
          </div>
        )}

        {proposals && proposals.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-300">
                AI 提议的 {proposals.length} 集：
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setProposals(null)}
                  className="rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-400 hover:border-neutral-700"
                  type="button"
                >
                  丢弃
                </button>
                <button
                  onClick={handleSaveAll}
                  className="rounded bg-emerald-700 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-600"
                  type="button"
                >
                  全部保存为集数
                </button>
              </div>
            </div>

            {proposals.map((p, idx) => (
              <div
                key={idx}
                className="rounded border border-neutral-800 bg-neutral-900/60 p-3"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-[11px] text-neutral-500">
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-medium text-neutral-100">
                    《{p.title}》
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] ${PRIORITY_COLOR[p.priority] ?? PRIORITY_COLOR.B}`}
                  >
                    {p.priority}
                  </span>
                  <span className="ml-auto text-[10px] text-neutral-500">
                    {p.targetDuration}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1.5 text-[11px]">
                  <Row label="钩子" value={p.hook} />
                  <Row label="主冲突" value={p.mainConflict} />
                  <Row label="高潮" value={p.climax} />
                  <Row label="悬念" value={p.suspense} />
                  <Row
                    label="记忆点"
                    value={p.memoryPoints.join(' · ')}
                  />
                  <Row label="平台卖点" value={p.platformSellingPoint} />
                </div>
              </div>
            ))}
          </div>
        )}

        {matrix && matrix.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-sepia-200">
                内容矩阵 · {matrix.length} 个格式
              </span>
              <button
                onClick={() => setMatrix(null)}
                className="rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-400 hover:border-neutral-700"
                type="button"
              >
                全部丢弃
              </button>
            </div>
            {matrix.map((item) => (
              <div
                key={item.format}
                className={`rounded-lg border p-3 ${item.error ? 'border-red-900/50 bg-red-950/10' : 'border-sepia-900/40 bg-sepia-950/10'}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-sepia-700/50 bg-sepia-900/30 px-2 py-0.5 text-[11px] font-medium text-sepia-100">
                      {item.format}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {item.error ? '失败' : `${item.episodes.length} 集候选`}
                    </span>
                  </div>
                  {!item.error && item.episodes.length > 0 && (
                    <button
                      onClick={() => saveMatrixGroup(item)}
                      className="rounded bg-emerald-700 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-600"
                      type="button"
                    >
                      保存这一版（{item.episodes.length}）
                    </button>
                  )}
                </div>
                {item.error ? (
                  <div className="text-[11px] text-red-300">⚠️ {item.error}</div>
                ) : (
                  <div className="space-y-1.5">
                    {item.episodes.map((p, idx) => (
                      <div
                        key={idx}
                        className="rounded border border-neutral-800 bg-neutral-900/60 px-2 py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-neutral-500">
                            #{idx + 1}
                          </span>
                          <span className="text-[12px] font-medium text-neutral-100">
                            《{p.title}》
                          </span>
                          <span
                            className={`rounded border px-1 py-0.5 text-[9px] ${PRIORITY_COLOR[p.priority] ?? PRIORITY_COLOR.B}`}
                          >
                            {p.priority}
                          </span>
                          <span className="ml-auto text-[9px] text-neutral-500">
                            {p.targetDuration}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-neutral-400">
                          钩子：{p.hook}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {p.platformSellingPoint}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 情绪曲线 */}
      <EmotionArcViz chapter={chapter} />

      {/* 金句提取区 */}
      <div className="mb-4 rounded-lg border border-amber-900/40 bg-amber-950/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-200">
              <Quote size={12} /> 金句提取
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-500">
              从本章挑出适合做字幕 / 封面文案 / 置顶评论的句子
            </div>
          </div>
          <div className="flex gap-2">
            {punchlineBusy && (
              <button
                onClick={() => punchAbortRef.current?.abort()}
                className="rounded border border-red-800 bg-red-950/30 px-2 py-1 text-[11px] text-red-300 hover:border-red-700"
                type="button"
              >
                取消
              </button>
            )}
            <button
              onClick={handleExtractPunchlines}
              disabled={punchlineBusy}
              className="flex items-center gap-1 rounded bg-amber-700 px-3 py-1 text-[11px] font-medium text-amber-50 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {punchlineBusy && <Spinner size={10} />}
              {punchlineBusy
                ? '提取中…'
                : punchlines
                  ? '重新提取'
                  : '提取 8 条金句'}
            </button>
          </div>
        </div>
        {punchlineError && (
          <div className="mt-2 rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
            {punchlineError}
          </div>
        )}
        {punchlines && punchlines.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {punchlines.map((p, idx) => (
              <div
                key={idx}
                className="rounded border border-neutral-800 bg-neutral-900/60 p-2"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] text-neutral-300">
                    {p.mood}
                  </span>
                  <button
                    onClick={() => saveToLibrary(p)}
                    className="ml-auto rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-amber-300"
                    type="button"
                    title="收藏到资产库"
                  >
                    <BookmarkPlus size={10} />
                  </button>
                </div>
                <div className="text-[13px] font-medium leading-relaxed text-neutral-100">
                  {p.text}
                </div>
                <div className="mt-1 text-[10px] text-neutral-500">
                  💡 {p.why}
                </div>
                <div className="mt-0.5 text-[10px] text-neutral-600">
                  原文位置：…{p.contextHint}…
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 章节正文 — 古籍页面样式 */}
      <article className="classical-page scrollbar-thin relative max-h-[calc(100vh-400px)] overflow-y-auto rounded-lg border border-sepia-900/30 bg-gradient-to-br from-sepia-950/15 via-ink-900/40 to-sepia-950/10 p-6">
        <CornerFlourish
          size={20}
          className="absolute left-2 top-2 text-sepia-700/40"
        />
        <CornerFlourish
          size={20}
          className="absolute right-2 top-2 -scale-x-100 text-sepia-700/40"
        />
        <CornerFlourish
          size={20}
          className="absolute left-2 bottom-2 -scale-y-100 text-sepia-700/40"
        />
        <CornerFlourish
          size={20}
          className="absolute right-2 bottom-2 -scale-100 text-sepia-700/40"
        />

        {chapter.content
          .split(/\n\s*\n/)
          .filter((p) => p.trim())
          .map((para, i) => (
            <p
              key={i}
              className={`body-prose text-[15px] text-sepia-100/90 ${i === 0 ? 'drop-cap' : ''}`}
              style={{ textIndent: i === 0 ? '0' : '2em', marginBottom: '1em' }}
            >
              {para.trim()}
            </p>
          ))}

        <div className="mt-4 text-center text-[11px] text-sepia-500/40">
          —— 完 ——
        </div>
      </article>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start gap-2">
    <span className="shrink-0 w-14 text-neutral-500">{label}</span>
    <span className="text-neutral-300">{value}</span>
  </div>
);

export default ChapterDetail;
