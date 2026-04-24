import { useEffect } from 'react';

/**
 * Ctrl+Enter 或 Cmd+Enter 触发保存。只在 enabled=true 时挂监听。
 * 适合 modal 编辑表单。
 */
export function useModalSave(enabled: boolean, onSave: () => void): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onSave]);
}
