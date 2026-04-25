import React, { useState } from 'react';
import {
  BookMarked,
  Brain,
  Cog,
  Keyboard,
  Search,
  ShieldCheck,
} from 'lucide-react';
import ModelSettingsModal from '../features/settings/ModelSettingsModal';
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
  const openGlobalSearch = useUIStore((s) => s.openGlobalSearch);
  const thinkingMode = useUIStore((s) => s.thinkingMode);
  const setThinkingMode = useUIStore((s) => s.setThinkingMode);
  const [consistencyOpen, setConsistencyOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false);

  return (
    <header className="relative flex h-12 shrink-0 items-center justify-between border-b border-ink-700/60 bg-gradient-to-r from-ink-900 via-ink-800/95 to-ink-900 px-5">
      {/* 顶部装饰金线 */}
      <div className="ornamental-rule absolute inset-x-0 top-0 h-px opacity-40" />

      <div className="flex items-baseline gap-3">
        <h1 className="ip-title text-lg leading-none text-sepia-100">
          《李聪传》
        </h1>
        <span className="text-[11px] text-sepia-300/70">
          AI 短剧生产工作台
        </span>
        <span className="rounded-sm border border-sepia-800/50 bg-sepia-900/30 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-sepia-400">
          v0.1
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <IconButton
          onClick={openGlobalSearch}
          icon={<Search size={12} />}
          label="搜索"
          hint="⌘/"
          title="全局搜索（Ctrl/⌘ + /）"
        />

        <Divider />

        <StatsIndicator />
        <StorageIndicator />

        <Divider />

        <IconBtn
          onClick={() => setModelSettingsOpen(true)}
          title="模型设置（自定义模型 ID）"
        >
          <Cog size={12} />
        </IconBtn>
        <IconBtn
          onClick={() => setThinkingMode(!thinkingMode)}
          title={
            thinkingMode
              ? '深度思考已开启 · 点击关闭'
              : '开启 Gemini 深度思考'
          }
          active={thinkingMode}
          activeStyle="border-violet-600/60 bg-violet-900/30 text-violet-200"
        >
          <Brain size={12} />
        </IconBtn>
        <IconBtn
          onClick={() => setConsistencyOpen(true)}
          title="跨集一致性检查"
        >
          <ShieldCheck size={12} />
        </IconBtn>
        <IconBtn
          onClick={() => setLibraryOpen(true)}
          title="资产库（金句 / 风格模板）"
        >
          <BookMarked size={12} />
        </IconBtn>
        <BackupButton />
        <IconBtn
          onClick={openKeyboardHints}
          title="快捷键（按 ? 也能打开）"
        >
          <Keyboard size={12} />
        </IconBtn>

        <Divider />

        <button
          onClick={openApiKey}
          className={`group flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] transition-all ${
            apiKeyPresent
              ? 'border-emerald-700/40 bg-emerald-900/20 text-emerald-200 hover:border-emerald-600/60 hover:bg-emerald-900/30'
              : 'border-amber-700/50 bg-amber-900/20 text-amber-200 hover:border-amber-600/70 hover:bg-amber-900/30 animate-warm-pulse'
          }`}
          type="button"
          title={apiKeyPresent ? '点击更换' : '点击配置 API Key'}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              apiKeyPresent
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]'
                : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]'
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
      <ModelSettingsModal
        open={modelSettingsOpen}
        onClose={() => setModelSettingsOpen(false)}
      />
    </header>
  );
};

const Divider: React.FC = () => (
  <span className="mx-0.5 inline-block h-4 w-px bg-ink-700" aria-hidden />
);

const IconBtn: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  activeStyle?: string;
}> = ({ onClick, title, children, active, activeStyle }) => (
  <button
    onClick={onClick}
    type="button"
    title={title}
    className={`rounded-md border p-1.5 transition ${
      active
        ? activeStyle ?? 'border-sepia-700 bg-sepia-900/30 text-sepia-200'
        : 'border-transparent text-ink-300 hover:border-ink-700 hover:bg-ink-800/60 hover:text-sepia-200'
    }`}
  >
    {children}
  </button>
);

const IconButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  title: string;
}> = ({ onClick, icon, label, hint, title }) => (
  <button
    onClick={onClick}
    type="button"
    title={title}
    className="flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-[11px] text-ink-300 transition hover:border-ink-700 hover:bg-ink-800/60 hover:text-sepia-200"
  >
    {icon}
    <span>{label}</span>
    {hint && (
      <kbd className="rounded border border-ink-700 bg-ink-900 px-1 py-0.5 font-mono text-[9px] text-ink-400">
        {hint}
      </kbd>
    )}
  </button>
);

export default Header;
