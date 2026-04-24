import React, { useRef, useState } from 'react';
import { BookMarked, Copy, Trash2, X } from 'lucide-react';
import { useLibraryStore } from '../../stores';
import { useEscapeKey } from '../../components/useEscapeKey';
import { useFocusTrap } from '../../components/useFocusTrap';
import { toast } from '../../stores/toastStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = 'hooks' | 'styles';

const LibraryModal: React.FC<Props> = ({ open, onClose }) => {
  const hooks = useLibraryStore((s) => s.hooks);
  const styles = useLibraryStore((s) => s.styles);
  const removeHook = useLibraryStore((s) => s.removeHook);
  const removeStyle = useLibraryStore((s) => s.removeStyle);

  const [tab, setTab] = useState<Tab>('hooks');
  const containerRef = useRef<HTMLDivElement>(null);
  useEscapeKey(open, onClose);
  useFocusTrap(open, containerRef);

  if (!open) return null;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制');
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="scrollbar-thin max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BookMarked size={16} className="text-amber-300" />
            <h2 className="text-base font-semibold text-neutral-100">资产库</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300"
            type="button"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mb-4 flex gap-1 border-b border-neutral-800">
          <TabButton active={tab === 'hooks'} onClick={() => setTab('hooks')}>
            金句 / 钩子（{hooks.length}）
          </TabButton>
          <TabButton active={tab === 'styles'} onClick={() => setTab('styles')}>
            风格模板（{styles.length}）
          </TabButton>
        </div>

        {tab === 'hooks' && (
          <div className="space-y-2">
            {hooks.length === 0 && (
              <EmptyHint text="在钩子工坊点每条候选旁的「收藏」保存到此处" />
            )}
            {hooks.map((h) => (
              <div
                key={h.id}
                className="rounded border border-neutral-800 bg-neutral-900/60 p-3"
              >
                <div className="mb-1 flex items-center gap-2 text-[10px] text-neutral-500">
                  {h.style && (
                    <span className="rounded bg-neutral-800 px-1.5 py-0.5">
                      {h.style}
                    </span>
                  )}
                  <span>{new Date(h.savedAt).toLocaleDateString()}</span>
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={() => copyText(h.text)}
                      className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
                      type="button"
                      title="复制"
                    >
                      <Copy size={10} />
                    </button>
                    <button
                      onClick={() => removeHook(h.id)}
                      className="rounded p-1 text-neutral-500 hover:bg-red-950/40 hover:text-red-400"
                      type="button"
                      title="删除"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
                <div className="text-xs leading-relaxed text-neutral-100">
                  {h.text}
                </div>
                {h.why && (
                  <div className="mt-1 text-[10px] text-neutral-500">
                    💡 {h.why}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'styles' && (
          <div className="space-y-2">
            {styles.length === 0 && (
              <EmptyHint text="在 ShotKeyframeModal 生成关键帧后点「保存风格模板」" />
            )}
            {styles.map((st) => (
              <div
                key={st.id}
                className="rounded border border-neutral-800 bg-neutral-900/60 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-neutral-200">
                    {st.name}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => copyText(st.prompt)}
                      className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
                      type="button"
                      title="复制 prompt"
                    >
                      <Copy size={10} />
                    </button>
                    <button
                      onClick={() => removeStyle(st.id)}
                      className="rounded p-1 text-neutral-500 hover:bg-red-950/40 hover:text-red-400"
                      type="button"
                      title="删除"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
                {st.thumbnailUrl && (
                  <img
                    src={st.thumbnailUrl}
                    alt={st.name}
                    className="mb-2 h-32 w-auto rounded border border-neutral-800"
                  />
                )}
                <pre className="scrollbar-thin max-h-24 overflow-y-auto whitespace-pre-wrap rounded bg-neutral-900 p-2 font-mono text-[10px] text-neutral-300">
                  {st.prompt}
                </pre>
                <div className="mt-1 text-[10px] text-neutral-600">
                  {new Date(st.savedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    type="button"
    className={`relative px-2.5 py-1 text-xs transition ${
      active ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'
    }`}
  >
    {children}
    {active && (
      <span className="absolute inset-x-2.5 -bottom-[7px] h-0.5 bg-neutral-100" />
    )}
  </button>
);

const EmptyHint: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded border border-dashed border-neutral-800 bg-neutral-900/30 p-6 text-center text-[11px] text-neutral-500">
    {text}
  </div>
);

export default LibraryModal;
