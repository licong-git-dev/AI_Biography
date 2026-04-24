import React, { useRef, useState } from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import type { Episode } from '../../types';
import { useEpisodeStore, useUIStore } from '../../stores';
import { generateHookCandidates, type HookCandidate } from './hookService';
import { ApiKeyMissingError } from '../../services/geminiClient';
import { isAbortError } from '../../services/abort';
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
      if (isAbortError(e)) {
        setError('已取消');
      } else if (e instanceof ApiKeyMissingError) {
        setError(e.message);
        openApiKey();
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

  const handleAdopt = (c: HookCandidate) => {
    update(episode.id, { hook: c.text });
    toast.success(`已将钩子更新为：${c.text.slice(0, 20)}…`);
    setCandidates(null);
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
                  onClick={() => handleAdopt(c)}
                  className="ml-auto rounded border border-emerald-800 bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-200 hover:border-emerald-700"
                  type="button"
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
