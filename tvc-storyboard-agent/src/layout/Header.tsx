import React, { useState } from 'react';
import { BookMarked, Brain, Keyboard, ShieldCheck } from 'lucide-react';
import { useUIStore } from '../stores';
import StorageIndicator from '../components/StorageIndicator';
import StatsIndicator from '../components/StatsIndicator';
import BackupButton from '../features/backup/BackupButton';
import ConsistencyModal from '../features/consistency/ConsistencyModal';
import LibraryModal from '../features/library/LibraryModal';

const Header: React.FC = () => {
  const apiKeyPresent = useUIStore((s) => s.apiKeyPresent);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);
  const openKeyboardHints = useUIStore((s) => s.openKeyboardHints);
  const thinkingMode = useUIStore((s) => s.thinkingMode);
  const setThinkingMode = useUIStore((s) => s.setThinkingMode);
  const [consistencyOpen, setConsistencyOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <header className="flex h-10 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-neutral-100">
          《李聪传》AI 短剧生产工作台
        </span>
        <span className="text-[10px] text-neutral-600">v0.1 · Phase 7</span>
      </div>

      <div className="flex items-center gap-2">
        <StatsIndicator />
        <StorageIndicator />
        <button
          onClick={() => setThinkingMode(!thinkingMode)}
          className={`rounded border p-1 transition ${
            thinkingMode
              ? 'border-violet-700 bg-violet-900/30 text-violet-200'
              : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
          }`}
          type="button"
          title={
            thinkingMode
              ? '深度思考已开启（文本类 AI 会更慢但更稳，费用略高）。点击关闭'
              : '开启 Gemini 深度思考：文本类 AI 输出更稳定，代价是每次调用更慢+费用略高'
          }
        >
          <Brain size={12} />
        </button>
        <button
          onClick={() => setConsistencyOpen(true)}
          className="rounded border border-neutral-800 p-1 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
          type="button"
          title="跨集一致性检查"
        >
          <ShieldCheck size={12} />
        </button>
        <button
          onClick={() => setLibraryOpen(true)}
          className="rounded border border-neutral-800 p-1 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
          type="button"
          title="资产库（金句 / 风格模板）"
        >
          <BookMarked size={12} />
        </button>
        <BackupButton />
        <button
          onClick={openKeyboardHints}
          className="rounded border border-neutral-800 p-1 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
          type="button"
          title="快捷键（按 ? 也能打开）"
        >
          <Keyboard size={12} />
        </button>
        <button
          onClick={openApiKey}
          className="flex items-center gap-1.5 rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-300 hover:border-neutral-700 hover:text-neutral-100"
          type="button"
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              apiKeyPresent ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span>{apiKeyPresent ? 'API Key 已配置' : '配置 API Key'}</span>
        </button>
      </div>
      <ConsistencyModal
        open={consistencyOpen}
        onClose={() => setConsistencyOpen(false)}
      />
      <LibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </header>
  );
};

export default Header;
