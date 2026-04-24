import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { useStatsStore, type AICallKind } from '../stores/statsStore';

const KIND_LABEL: Record<AICallKind, string> = {
  text: '文本',
  image: '图像',
  video: '视频',
  tts: 'TTS',
  stt: 'STT',
  'chat-stream': '对话',
};

const StatsIndicator: React.FC = () => {
  const total = useStatsStore((s) => s.total);
  const byKind = useStatsStore((s) => s.byKind);
  const reset = useStatsStore((s) => s.reset);
  const sessionStart = useStatsStore((s) => s.sessionStart);
  const [popoverOpen, setPopoverOpen] = useState(false);

  if (total === 0) return null;

  const sessionMinutes = Math.max(
    1,
    Math.round((Date.now() - sessionStart) / 60000)
  );

  return (
    <div className="relative">
      <button
        onClick={() => setPopoverOpen((v) => !v)}
        className="flex items-center gap-1 rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-300 hover:border-neutral-700 hover:text-neutral-100"
        type="button"
        title="本次会话 AI 调用统计（点击展开明细）"
      >
        <Activity size={11} />
        <span>{total} 次</span>
      </button>

      {popoverOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setPopoverOpen(false)}
          />
          <div className="absolute right-0 top-full z-40 mt-1 w-56 rounded-lg border border-neutral-800 bg-neutral-950 p-3 shadow-xl">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wide text-neutral-500">
                本次会话（{sessionMinutes} 分钟）
              </span>
              <button
                onClick={() => {
                  reset();
                  setPopoverOpen(false);
                }}
                className="text-[10px] text-neutral-500 hover:text-neutral-300"
                type="button"
              >
                归零
              </button>
            </div>
            <div className="space-y-1 text-[11px]">
              {(Object.keys(byKind) as AICallKind[])
                .filter((k) => byKind[k] > 0)
                .sort((a, b) => byKind[b] - byKind[a])
                .map((k) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-neutral-400">{KIND_LABEL[k]}</span>
                    <span className="font-mono text-neutral-200">
                      {byKind[k]}
                    </span>
                  </div>
                ))}
              <div className="border-t border-neutral-800 pt-1 flex justify-between">
                <span className="text-neutral-500">合计</span>
                <span className="font-mono text-neutral-100">{total}</span>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-neutral-600">
              仅本次会话计数。页面刷新后重置。
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsIndicator;
