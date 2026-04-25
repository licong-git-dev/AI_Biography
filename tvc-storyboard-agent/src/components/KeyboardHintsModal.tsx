import React, { useRef } from 'react';
import { Keyboard, X } from 'lucide-react';
import { useUIStore } from '../stores';
import { useEscapeKey } from './useEscapeKey';
import { useFocusTrap } from './useFocusTrap';

interface Shortcut {
  keys: string[];
  label: string;
}

interface Section {
  title: string;
  items: Shortcut[];
}

const SECTIONS: Section[] = [
  {
    title: '全局',
    items: [
      { keys: ['?'], label: '打开/关闭快捷键列表' },
      { keys: ['Ctrl/⌘', '/'], label: '全局搜索（角色/集/镜头/章节/资产）' },
      { keys: ['Esc'], label: '关闭当前弹窗' },
    ],
  },
  {
    title: '弹窗编辑',
    items: [
      { keys: ['Ctrl', 'Enter'], label: '保存当前弹窗（Mac：⌘+Enter）' },
      { keys: ['Esc'], label: '放弃编辑并关闭' },
    ],
  },
  {
    title: '对话面板',
    items: [
      { keys: ['Enter'], label: '发送消息' },
      { keys: ['Shift', 'Enter'], label: '换行' },
    ],
  },
  {
    title: '镜头表',
    items: [
      { keys: ['hover', '↑/↓'], label: '上下移动镜头' },
      { keys: ['hover', '🗑'], label: '删除镜头' },
      { keys: ['click'], label: '打开镜头详情弹窗' },
    ],
  },
];

const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] text-neutral-200 shadow-sm">
    {children}
  </kbd>
);

const KeyboardHintsModal: React.FC = () => {
  const open = useUIStore((s) => s.keyboardHintsOpen);
  const close = useUIStore((s) => s.closeKeyboardHints);

  const containerRef = useRef<HTMLDivElement>(null);
  useEscapeKey(open, close);
  useFocusTrap(open, containerRef);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <div
        ref={containerRef}
        className="scrollbar-thin max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-neutral-400" />
            <h2 className="text-base font-semibold text-neutral-100">快捷键</h2>
          </div>
          <button
            onClick={close}
            className="text-neutral-500 hover:text-neutral-300"
            type="button"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="mb-2 text-[11px] uppercase tracking-wide text-neutral-500">
                {section.title}
              </div>
              <div className="space-y-1.5">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-900"
                  >
                    <span>{item.label}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      {item.keys.map((k, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && (
                            <span className="text-[10px] text-neutral-600">+</span>
                          )}
                          <Key>{k}</Key>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-neutral-800 pt-3 text-[11px] text-neutral-500">
          任何时候按{' '}
          <kbd className="rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 font-mono text-[10px] text-neutral-300">
            ?
          </kbd>{' '}
          可以重新打开本列表
        </div>
      </div>
    </div>
  );
};

export default KeyboardHintsModal;
