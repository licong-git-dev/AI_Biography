import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Cog, RefreshCw, X, XCircle } from 'lucide-react';
import {
  DEFAULT_MODELS,
  type ModelKind,
} from '../../services/geminiClient';
import { useModelStore } from '../../stores/modelStore';
import { probeTextModel, probeKeyModels } from './modelHealthService';
import { useEscapeKey } from '../../components/useEscapeKey';
import { useFocusTrap } from '../../components/useFocusTrap';
import Spinner from '../../components/Spinner';
import { toast } from '../../stores/toastStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

const KIND_INFO: Record<ModelKind, { label: string; note: string; canPing: boolean }> = {
  TEXT: { label: '文本主模型', note: '拆集 / 镜头表 / 平台文案 / 钩子等结构化任务', canPing: true },
  FAST: { label: '快速文本', note: '轻量任务备用（当前未广泛使用）', canPing: true },
  VISION: { label: '视觉理解', note: '图像分析（当前未使用）', canPing: false },
  IMAGE: { label: '图像生成', note: 'Nano Banana Pro · 角色参考图 / 关键帧 / 封面', canPing: false },
  VIDEO: { label: '视频生成', note: 'Veo 3 · 图生视频。普通账号大概率没开通', canPing: false },
  TTS: { label: '语音合成', note: '旁白配音', canPing: false },
  STT: { label: '语音转写', note: '从配音生成 SRT 字幕', canPing: false },
};

const ModelSettingsModal: React.FC<Props> = ({ open, onClose }) => {
  const overrides = useModelStore((s) => s.overrides);
  const health = useModelStore((s) => s.health);
  const setOverride = useModelStore((s) => s.setOverride);
  const resetOverrides = useModelStore((s) => s.resetOverrides);

  const [probingAll, setProbingAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEscapeKey(open, onClose);
  useFocusTrap(open, containerRef);

  useEffect(() => {
    // 打开时若 TEXT 还没探测过，自动 ping 一下
    if (open && !health.TEXT) {
      void probeTextModel('TEXT').catch(() => {});
    }
  }, [open, health.TEXT]);

  const probeAll = async () => {
    setProbingAll(true);
    try {
      await probeKeyModels();
      toast.info('模型可用性已探测（图像/视频/音频不做主动探测，调用时再确认）');
    } finally {
      setProbingAll(false);
    }
  };

  const probeOne = async (kind: ModelKind) => {
    if (!KIND_INFO[kind].canPing) {
      toast.warning(`${KIND_INFO[kind].label} 不支持 ping，等触发时再判断可用性`);
      return;
    }
    await probeTextModel(kind);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="scrollbar-thin max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Cog size={16} className="text-neutral-400" />
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                Gemini 模型设置
              </h2>
              <div className="mt-0.5 text-[11px] text-neutral-500">
                你的账号没开通某个模型时，这里改成有权限的备选 ID 即可
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300"
            type="button"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={probeAll}
            disabled={probingAll}
            className="flex items-center gap-1 rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            {probingAll && <Spinner size={11} />}
            {probingAll ? '探测中…' : '探测主要文本模型'}
          </button>
          <button
            onClick={() => {
              if (confirm('重置所有模型 ID 到默认？')) {
                resetOverrides();
                toast.success('已重置到默认 ID');
              }
            }}
            className="text-[11px] text-neutral-500 hover:text-neutral-300"
            type="button"
          >
            还原默认
          </button>
        </div>

        <div className="space-y-2">
          {(Object.keys(DEFAULT_MODELS) as ModelKind[]).map((kind) => {
            const def = DEFAULT_MODELS[kind];
            const override = overrides[kind] ?? '';
            const effective = override.trim() || def;
            const h = health[kind];
            const info = KIND_INFO[kind];

            return (
              <div
                key={kind}
                className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-200">
                    {info.label}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-600">
                    {kind}
                  </span>
                  {h?.status === 'ok' && (
                    <span className="flex items-center gap-0.5 rounded bg-emerald-900/40 px-1.5 py-0.5 text-[10px] text-emerald-300">
                      <CheckCircle2 size={9} /> 可用
                    </span>
                  )}
                  {h?.status === 'fail' && (
                    <span
                      className="flex items-center gap-0.5 rounded bg-red-900/40 px-1.5 py-0.5 text-[10px] text-red-300"
                      title={h.lastError}
                    >
                      <XCircle size={9} /> 不可用
                    </span>
                  )}
                  {h?.status === 'probing' && (
                    <span className="flex items-center gap-0.5 rounded bg-sky-900/40 px-1.5 py-0.5 text-[10px] text-sky-300">
                      <Spinner size={9} /> 探测中
                    </span>
                  )}
                  {info.canPing && (
                    <button
                      onClick={() => probeOne(kind)}
                      disabled={h?.status === 'probing'}
                      className="ml-auto rounded p-0.5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
                      type="button"
                      title="ping 一下"
                    >
                      <RefreshCw size={10} />
                    </button>
                  )}
                </div>

                <div className="mb-1 text-[10px] text-neutral-500">
                  {info.note}
                </div>

                <input
                  type="text"
                  value={override}
                  onChange={(e) => setOverride(kind, e.target.value)}
                  placeholder={`默认：${def}`}
                  className="w-full rounded border border-neutral-800 bg-neutral-900 px-2 py-1 font-mono text-[11px] text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
                {override && override !== def && (
                  <div className="mt-0.5 text-[9px] text-amber-400">
                    覆盖中 · 当前使用：{effective}
                  </div>
                )}

                {h?.status === 'fail' && h.lastError && (
                  <div className="mt-1 rounded border border-red-900/40 bg-red-950/30 p-1.5 text-[10px] text-red-300">
                    {h.lastError}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded border border-neutral-800 bg-neutral-900/30 p-3 text-[11px] text-neutral-400">
          <div className="mb-1 font-medium text-neutral-200">常见替换 ID</div>
          <ul className="space-y-0.5 text-[10px]">
            <li>· 文本：<code className="text-neutral-300">gemini-2.5-pro</code> / <code className="text-neutral-300">gemini-2.5-flash</code></li>
            <li>· 图像：<code className="text-neutral-300">gemini-2.5-flash-image-preview</code>（旧版 Nano Banana）</li>
            <li>· 视频：Veo 3 普通账号未必开通；写完整 model ID 可能需要 paid tier</li>
            <li>· TTS：<code className="text-neutral-300">gemini-2.5-flash-preview-tts</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ModelSettingsModal;
