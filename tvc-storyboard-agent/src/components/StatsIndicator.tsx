import React, { useState } from 'react';
import { Activity, DollarSign, Settings2 } from 'lucide-react';
import {
  DEFAULT_PRICE_USD,
  useStatsStore,
  type AICallKind,
} from '../stores/statsStore';

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
  const priceOverride = useStatsStore((s) => s.priceOverride);
  const setPrice = useStatsStore((s) => s.setPrice);
  const resetPrices = useStatsStore((s) => s.resetPrices);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editingPrices, setEditingPrices] = useState(false);

  if (total === 0) return null;

  const effectivePrice = (k: AICallKind) =>
    priceOverride[k] ?? DEFAULT_PRICE_USD[k];

  const totalCost = (Object.keys(byKind) as AICallKind[]).reduce(
    (sum, k) => sum + byKind[k] * effectivePrice(k),
    0
  );

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
        <span className="text-neutral-500">·</span>
        <span className="font-mono">${totalCost.toFixed(2)}</span>
      </button>

      {popoverOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => {
              setPopoverOpen(false);
              setEditingPrices(false);
            }}
          />
          <div className="absolute right-0 top-full z-40 mt-1 w-72 rounded-lg border border-neutral-800 bg-neutral-950 p-3 shadow-xl">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wide text-neutral-500">
                本次会话（{sessionMinutes} 分钟）
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setEditingPrices((v) => !v)}
                  className="flex items-center gap-0.5 text-[10px] text-neutral-500 hover:text-neutral-300"
                  type="button"
                  title="编辑单价"
                >
                  <Settings2 size={10} />
                </button>
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
            </div>

            {!editingPrices ? (
              <>
                <div className="space-y-1 text-[11px]">
                  {(Object.keys(byKind) as AICallKind[])
                    .filter((k) => byKind[k] > 0)
                    .sort((a, b) => byKind[b] - byKind[a])
                    .map((k) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-neutral-400">{KIND_LABEL[k]}</span>
                        <span className="font-mono text-neutral-300">
                          {byKind[k]}
                        </span>
                        <span className="w-14 text-right font-mono text-neutral-500">
                          ${(byKind[k] * effectivePrice(k)).toFixed(3)}
                        </span>
                      </div>
                    ))}
                  <div className="flex justify-between border-t border-neutral-800 pt-1">
                    <span className="text-neutral-500">合计</span>
                    <span className="font-mono text-neutral-100">{total}</span>
                    <span className="w-14 text-right font-mono text-emerald-300">
                      <DollarSign size={9} className="inline" />
                      {totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-neutral-600">
                  单价为粗略估算。实际以 Google Cloud Billing 为准。点 ⚙
                  改单价。
                </p>
              </>
            ) : (
              <>
                <div className="space-y-1.5 text-[11px]">
                  {(Object.keys(DEFAULT_PRICE_USD) as AICallKind[]).map((k) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="w-12 text-neutral-400">
                        {KIND_LABEL[k]}
                      </span>
                      <span className="text-[9px] text-neutral-600">$</span>
                      <input
                        type="number"
                        step={0.001}
                        min={0}
                        value={effectivePrice(k)}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (Number.isFinite(v) && v >= 0) setPrice(k, v);
                        }}
                        className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-right font-mono text-[10px] text-neutral-100 focus:border-neutral-500 focus:outline-none"
                      />
                      <span className="w-8 text-[9px] text-neutral-600">
                        / 次
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (confirm('重置所有单价到默认？')) resetPrices();
                    }}
                    className="text-[10px] text-neutral-500 hover:text-neutral-300"
                    type="button"
                  >
                    还原默认
                  </button>
                  <button
                    onClick={() => setEditingPrices(false)}
                    className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-100 hover:bg-neutral-700"
                    type="button"
                  >
                    完成
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-neutral-600">
                  单价持久保存在 localStorage.licong-stats
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StatsIndicator;
