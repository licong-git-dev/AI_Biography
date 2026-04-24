import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore, type ToastKind } from '../stores/toastStore';

const CONFIG: Record<
  ToastKind,
  { border: string; bg: string; text: string; icon: React.ReactNode }
> = {
  info: {
    border: 'border-sky-800',
    bg: 'bg-sky-950/80',
    text: 'text-sky-100',
    icon: <Info size={14} className="text-sky-300" />,
  },
  success: {
    border: 'border-emerald-800',
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-100',
    icon: <CheckCircle2 size={14} className="text-emerald-300" />,
  },
  error: {
    border: 'border-red-800',
    bg: 'bg-red-950/80',
    text: 'text-red-100',
    icon: <XCircle size={14} className="text-red-300" />,
  },
  warning: {
    border: 'border-amber-800',
    bg: 'bg-amber-950/80',
    text: 'text-amber-100',
    icon: <AlertTriangle size={14} className="text-amber-300" />,
  },
};

const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => {
        const cfg = CONFIG[t.kind];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur-sm ${cfg.border} ${cfg.bg} ${cfg.text}`}
          >
            <div className="mt-0.5 shrink-0">{cfg.icon}</div>
            <div className="flex-1 text-xs leading-relaxed whitespace-pre-wrap">
              {t.message}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
              type="button"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
