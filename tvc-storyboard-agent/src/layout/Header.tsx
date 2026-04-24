import React from 'react';
import { Keyboard } from 'lucide-react';
import { useUIStore } from '../stores';
import StorageIndicator from '../components/StorageIndicator';
import StatsIndicator from '../components/StatsIndicator';
import BackupButton from '../features/backup/BackupButton';

const Header: React.FC = () => {
  const apiKeyPresent = useUIStore((s) => s.apiKeyPresent);
  const openApiKey = useUIStore((s) => s.openApiKeyModal);
  const openKeyboardHints = useUIStore((s) => s.openKeyboardHints);

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
    </header>
  );
};

export default Header;
