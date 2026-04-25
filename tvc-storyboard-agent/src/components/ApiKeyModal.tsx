import React, { useEffect, useRef, useState } from 'react';
import { getApiKey, setApiKey } from '../services/apiKey';
import { useUIStore } from '../stores';
import { useEscapeKey } from './useEscapeKey';
import { useModalSave } from './useModalSave';
import { useFocusTrap } from './useFocusTrap';
import { SealMark } from './Ornaments';

const ApiKeyModal: React.FC = () => {
  const open = useUIStore((s) => s.apiKeyModalOpen);
  const close = useUIStore((s) => s.closeApiKeyModal);
  const refresh = useUIStore((s) => s.refreshApiKey);

  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(getApiKey());
      setShowValue(false);
    }
  }, [open]);

  const save = () => {
    setApiKey(value);
    refresh();
    close();
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useEscapeKey(open, close);
  useModalSave(open, save);
  useFocusTrap(open, containerRef);

  if (!open) return null;

  const clear = () => {
    setValue('');
    setApiKey('');
    refresh();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <div
        ref={containerRef}
        className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-sepia-100">
            <SealMark size={14} className="text-sepia-500" />
            配置 Gemini API Key
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            从{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 underline underline-offset-2"
            >
              aistudio.google.com/apikey
            </a>{' '}
            获取，仅保存在浏览器 localStorage，不会上传。
          </p>
        </div>

        <div className="space-y-2">
          <input
            type={showValue ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="AIza..."
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
            autoFocus
            spellCheck={false}
          />
          <label className="flex items-center gap-1.5 text-xs text-neutral-400">
            <input
              type="checkbox"
              checked={showValue}
              onChange={(e) => setShowValue(e.target.checked)}
              className="accent-sky-500"
            />
            显示 Key
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            onClick={clear}
            className="rounded border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
            type="button"
          >
            清除
          </button>
          <div className="flex gap-2">
            <button
              onClick={close}
              className="rounded border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-700"
              type="button"
            >
              取消
            </button>
            <button
              onClick={save}
              className="rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
              type="button"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
