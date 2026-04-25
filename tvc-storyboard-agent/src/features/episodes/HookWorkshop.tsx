import React, { useRef, useState } from 'react';
import { BookmarkPlus, Lightbulb, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { Episode } from '../../types';
import {
  useEpisodeStore,
  useFeedbackStore,
  useLibraryStore,
  useUIStore,
} from '../../stores';
import { generateHookCandidates, type HookCandidate } from './hookService';
import { ApiKeyMissingError } from '../../services/geminiClient';
import { isAbortError } from '../../services/abort';
import { humanizeError } from '../../services/errorMessages';
import { toast } from '../../stores/toastStore';
import Spinner from '../../components/Spinner';

interface Props {
  episode: Episode;
}

const STYLE_COLOR: Record<HookCandidate['style'], string> = {
  视觉冲击: 'bg-rose-900/40 text-rose-200 border-rose-800/50',
  情绪共鸣: 'bg-amber-900/40 text-amber-200 border-amber-800/50',
  悬念设问: 'bg-sky-900/40 text-sky-200 border-sky-800/50',
  反差对比: 'bg-violet-900/40 text-violet-200 border-violet-800/50',
  金句宣告: 'bg-emerald-900/40 text-emerald-200 border-emerald-800/50',
};

const HookWorkshop: React.FC<Props> = ({ episode }) => {
  const update = useEpisodeStore((s) => s.update);
  const allEpisodes = useEpisodeStore((s) => s.episodes);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);
  const addLibraryHook = useLibraryStore((s) => s.addHook);
  const addFeedback = useFeedbackStore((s) => s.add);

  const [candidates, setCandidates] = useState<HookCandidate[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await generateHookCandidates(
        episode,
        5,
        controller.signal,
        allEpisodes
      );
      setCandidates(result);
    } catch (e) {
      const h = humanizeError(e);
      if (e instanceof ApiKeyMissingError) openApiKey();
      setError(h.aborted ? '已取消' : h.hint ? `${h.title}\n${h.hint}` : h.title);
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

  const handleAdopt = (c: HookCandidate) => {
    update(episode.id, { hook: c.text });
    // adopt 视为强正反馈；同时把没被采用的其它候选记为 rejected，形成偏好
    addFeedback({
      kind: 'hook',
      verdict: 'adopted',
      sample: `${c.style}：${c.text}`,
      sourceEpisodeId: episode.id,
    });
    if (candidates) {
      for (const other of candidates) {
        if (other.text !== c.text) {
          addFeedback({
            kind: 'hook',
            verdict: 'rejected',
            sample: `${other.style}：${other.text}`,
            sourceEpisodeId: episode.id,
          });
        }
      }
    }
    toast.success(`已将钩子更新为：${c.text.slice(0, 20)}…`);
    setCandidates(null);
  };

  const handleFavorite = (c: HookCandidate) => {
    addLibraryHook({
      text: c.text,
      style: c.style,
      why: c.why,
      sourceEpisodeId: episode.id,
    });
    addFeedback({
      kind: 'hook',
      verdict: 'up',
      sample: `${c.style}：${c.text}`,
      sourceEpisodeId: episode.id,
    });
    toast.success('已收藏到资产库');
  };

  const handleThumb = (c: HookCandidate, verdict: 'up' | 'down') => {
    addFeedback({
      kind: 'hook',
      verdict,
      sample: `${c.style}：${c.text}`,
      sourceEpisodeId: episode.id,
    });
    toast.info(verdict === 'up' ? '记为偏好 👍' : '记为不喜欢 👎');
  };

  return (
    <div className="mt-3 rounded-lg border border-amber-900/40 bg-amber-950/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-200">
          <Lightbulb size={12} /> 钩子工坊
        </span>
        <span className="text-[10px] text-neutral-500">
          3 秒留人 = 完播率
        </span>
      </div>

      {episode.hook && (
        <div className="mb-2 rounded border border-neutral-800 bg-neutral-900/60 p-2 text-[11px]">
          <span className="text-neutral-500">当前钩子：</span>
          <span className="text-neutral-200">{episode.hook}</span>
        </div>
      )}

      {!candidates && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-neutral-400">
            AI 一次给 5 个风格不同的钩子候选，你挑一个覆盖。
          </span>
          <div className="flex gap-1.5">
            {generating && (
              <button
                onClick={() => abortRef.current?.abort()}
                className="rounded border border-red-800 bg-red-950/30 px-2 py-1 text-[11px] text-red-300 hover:border-red-700"
                type="button"
              >
                取消
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1 rounded bg-amber-700 px-2.5 py-1 text-[11px] font-medium text-amber-50 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {generating ? <Spinner size={10} /> : <Sparkles size={10} />}
              {generating ? '思考中…' : '生成 5 个钩子候选'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 rounded border border-red-900/50 bg-red-950/30 p-2 text-[10px] text-red-300">
          {error}
        </div>
      )}

      {candidates && candidates.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-300">
              {candidates.length} 个候选，挑一个：
            </span>
            <button
              onClick={() => setCandidates(null)}
              className="text-[10px] text-neutral-500 hover:text-neutral-300"
              type="button"
            >
              丢弃
            </button>
          </div>
          {candidates.map((c, i) => (
            <div
              key={i}
              className="rounded border border-neutral-800 bg-neutral-900/60 p-2"
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] ${
                    STYLE_COLOR[c.style] ?? 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {c.style}
                </span>
                <button
                  onClick={() => handleThumb(c, 'up')}
                  className="ml-auto rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-emerald-300"
                  type="button"
                  title="记为偏好（不采用但喜欢）"
                >
                  <ThumbsUp size={10} />
                </button>
                <button
                  onClick={() => handleThumb(c, 'down')}
                  className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-red-300"
                  type="button"
                  title="记为不喜欢（以后避开）"
                >
                  <ThumbsDown size={10} />
                </button>
                <button
                  onClick={() => handleFavorite(c)}
                  className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-amber-300"
                  type="button"
                  title="收藏到资产库"
                >
                  <BookmarkPlus size={10} />
                </button>
                <button
                  onClick={() => handleAdopt(c)}
                  className="rounded border border-emerald-800 bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-200 hover:border-emerald-700"
                  type="button"
                  title="采用此钩子（其它候选自动记为"不喜欢"）"
                >
                  采用
                </button>
              </div>
              <div className="text-[12px] leading-relaxed text-neutral-100">
                {c.text}
              </div>
              <div className="mt-1 text-[10px] text-neutral-500">
                💡 {c.why}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HookWorkshop;
