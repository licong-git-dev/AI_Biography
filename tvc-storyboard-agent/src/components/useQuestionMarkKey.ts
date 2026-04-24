import { useEffect } from 'react';

/**
 * 全局监听 `?` 键。如果当前焦点在输入类元素（input/textarea/contenteditable）里，
 * 则不触发，避免用户打字被中断。
 */
export function useQuestionMarkKey(onHit: () => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '?') return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      e.preventDefault();
      onHit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onHit]);
}
