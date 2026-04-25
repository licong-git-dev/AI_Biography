import React, { useRef, useState } from 'react';
import { Activity, Sparkles } from 'lucide-react';
import type { Chapter } from '../../types';
import {
  analyzeChapterEmotionArc,
  TONE_COLOR,
  type EmotionPoint,
} from './emotionArcService';
import { ApiKeyMissingError } from '../../services/geminiClient';
import { isAbortError } from '../../services/abort';
import { useUIStore } from '../../stores';
import { useLibraryStore } from '../../stores';
import { toast } from '../../stores/toastStore';
import Spinner from '../../components/Spinner';

interface Props {
  chapter: Chapter;
}

const EmotionArcViz: React.FC<Props> = ({ chapter }) => {
  const openApiKey = useUIStore((s) => s.openApiKeyModal);
  const addLibraryHook = useLibraryStore((s) => s.addHook);

  const [points, setPoints] = useState<EmotionPoint[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = async () => {
    setError(null);
    setPoints(null);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await analyzeChapterEmotionArc(chapter, 10, controller.signal);
      setPoints(result);
    } catch (e) {
      if (isAbortError(e)) setError('已取消');
      else if (e instanceof ApiKeyMissingError) {
        setError(e.message);
        openApiKey();
      } else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const adoptAsHook = (p: EmotionPoint) => {
    addLibraryHook({
      text: p.snippet,
      style: p.tone,
      why: `情绪 ${p.tone} · 强度 ${p.intensity}/10 · 从第 ${chapter.number} 章 ${(p.position * 100).toFixed(0)}% 位置提取`,
    });
    toast.success(`已收藏：${p.snippet.slice(0, 14)}…`);
  };

  // SVG 折线图
  const W = 320;
  const H = 80;
  const PAD = 4;

  return (
    <div className="mb-4 rounded-lg border border-violet-900/40 bg-violet-950/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-violet-200">
            <Activity size={12} /> 情绪曲线
          </div>
          <div className="mt-0.5 text-[11px] text-neutral-500">
            找最适合做钩子的高情绪点
          </div>
        </div>
        <div className="flex gap-2">
          {busy && (
            <button
              onClick={() => abortRef.current?.abort()}
              className="rounded border border-red-800 bg-red-950/30 px-2 py-1 text-[11px] text-red-300 hover:border-red-700"
              type="button"
            >
              取消
            </button>
          )}
          <button
            onClick={run}
            disabled={busy}
            className="flex items-center gap-1 rounded bg-violet-700 px-3 py-1 text-[11px] font-medium text-violet-50 hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            {busy ? <Spinner size={10} /> : <Sparkles size={10} />}
            {busy ? '分析中…' : points ? '重新分析' : '分析情绪曲线'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-2 rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
          {error}
        </div>
      )}

      {points && points.length > 0 && (
        <div>
          {/* SVG 折线 */}
          <div className="mb-3 rounded border border-neutral-800 bg-neutral-950 p-2">
            <svg
              viewBox={`0 0 ${W} ${H + 20}`}
              className="w-full"
              preserveAspectRatio="none"
            >
              {/* 网格 */}
              <line
                x1={0}
                y1={H / 2}
                x2={W}
                y2={H / 2}
                stroke="#262626"
                strokeDasharray="2 2"
              />
              {/* 折线 */}
              <polyline
                points={points
                  .map((p) => {
                    const x = PAD + p.position * (W - 2 * PAD);
                    const y = H - (p.intensity / 10) * (H - 2 * PAD) - PAD;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#a78bfa"
                strokeWidth={1.5}
              />
              {/* 圆点 */}
              {points.map((p, i) => {
                const x = PAD + p.position * (W - 2 * PAD);
                const y = H - (p.intensity / 10) * (H - 2 * PAD) - PAD;
                const color = TONE_COLOR[p.tone] ?? '#a78bfa';
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={p.hookCandidate ? 4 : 2.5}
                      fill={color}
                      stroke={p.hookCandidate ? '#fff' : 'none'}
                      strokeWidth={p.hookCandidate ? 1 : 0}
                    >
                      <title>
                        {(p.position * 100).toFixed(0)}% · {p.tone} · 强度{' '}
                        {p.intensity}/10
                      </title>
                    </circle>
                  </g>
                );
              })}
              {/* 横轴标 */}
              <text x={PAD} y={H + 14} fontSize="9" fill="#525252">
                开头
              </text>
              <text
                x={W / 2}
                y={H + 14}
                fontSize="9"
                fill="#525252"
                textAnchor="middle"
              >
                中段
              </text>
              <text
                x={W - PAD}
                y={H + 14}
                fontSize="9"
                fill="#525252"
                textAnchor="end"
              >
                结尾
              </text>
            </svg>
            <div className="mt-1 flex items-center justify-between text-[9px] text-neutral-500">
              <span>低情绪 / 描述</span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full border border-white bg-violet-400" />
                建议作钩子
              </span>
              <span>高情绪 / 高潮</span>
            </div>
          </div>

          {/* 列表 */}
          <div className="space-y-1">
            {points.map((p, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded border p-2 text-[11px] ${
                  p.hookCandidate
                    ? 'border-violet-700/60 bg-violet-950/30'
                    : 'border-neutral-800 bg-neutral-900/40'
                }`}
              >
                <span className="shrink-0 font-mono text-neutral-500">
                  {(p.position * 100).toFixed(0)}%
                </span>
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-[9px]"
                  style={{
                    background: TONE_COLOR[p.tone] ?? '#404040',
                    color: '#fff',
                  }}
                >
                  {p.tone}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-neutral-500">
                  {p.intensity}/10
                </span>
                <span className="flex-1 text-neutral-200">{p.snippet}</span>
                {p.hookCandidate && (
                  <button
                    onClick={() => adoptAsHook(p)}
                    className="shrink-0 rounded border border-violet-700 bg-violet-900/40 px-1.5 py-0.5 text-[10px] text-violet-100 hover:bg-violet-800/50"
                    type="button"
                    title="收藏到资产库金句"
                  >
                    采用
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionArcViz;
