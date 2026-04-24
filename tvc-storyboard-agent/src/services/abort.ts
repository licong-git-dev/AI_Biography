/**
 * 让一个 Promise 对 AbortSignal 敏感：若 signal 已 abort 或中途 abort，
 * 返回的 Promise 立刻 reject 成 AbortError，不再等原 Promise 完成。
 *
 * 注意：这不会真的撕断底层 HTTP 连接（浏览器 fetch 底层会，但 Gemini
 * SDK 内部不一定）。它只保证调用方能及时停等、释放 UI 状态。
 */
export function raceAbort<T>(
  promise: Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  if (!signal) return promise;

  if (signal.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (v) => {
        signal.removeEventListener('abort', onAbort);
        resolve(v);
      },
      (e) => {
        signal.removeEventListener('abort', onAbort);
        reject(e);
      }
    );
  });
}

export function isAbortError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  if (e instanceof Error && e.name === 'AbortError') return true;
  if (e instanceof Error && /abort/i.test(e.message)) return true;
  return false;
}
