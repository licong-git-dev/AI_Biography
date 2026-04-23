import { useEffect } from 'react';

/**
 * 按 Esc 关闭 modal。enabled 为 false 时不挂监听。
 * 只在最顶层 modal 响应：同时打开多个时，上层 stopPropagation 的话下层不会触发。
 * 但本项目的 modal 都在 `window` 级别挂监听，无 stopPropagation —— 逐个
 * 使用时组件各自维护 open 状态即可。
 */
export function useEscapeKey(enabled: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscape();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onEscape]);
}
