import { useEffect } from 'react';

/**
 * 监听 Cmd/Ctrl + / 唤起全局搜索。在 input/textarea/contenteditable
 * 里也响应（即使在打字时也能秒呼出）。
 */
export function useGlobalSearchHotkey(onTrigger: () => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key !== '/') return;
      e.preventDefault();
      onTrigger();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onTrigger]);
}
