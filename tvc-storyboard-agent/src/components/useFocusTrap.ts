import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal 焦点陷阱。启用时：
 * 1. 保存打开前的焦点元素，关闭后恢复
 * 2. 自动聚焦容器内第一个可 focus 元素（避开 close "×" 按钮）
 * 3. Tab / Shift+Tab 循环在容器内
 *
 * 容器用 ref 传进来，open/enabled 控制激活。
 */
export function useFocusTrap<T extends HTMLElement>(
  enabled: boolean,
  containerRef: RefObject<T | null>
): void {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const root = containerRef.current;
    if (!root) return;

    previouslyFocused.current =
      (typeof document !== 'undefined'
        ? (document.activeElement as HTMLElement | null)
        : null) ?? null;

    // 聚焦首个非 "×" 关闭按钮的可 focus 元素
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    const firstReal =
      focusables.find((el) => {
        const text = el.textContent?.trim() ?? '';
        return text !== '✕' && text !== '×';
      }) ?? focusables[0];
    firstReal?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute('disabled'));
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0]!;
      const last = list[list.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !root.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const prev = previouslyFocused.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
      previouslyFocused.current = null;
    };
  }, [enabled, containerRef]);
}
