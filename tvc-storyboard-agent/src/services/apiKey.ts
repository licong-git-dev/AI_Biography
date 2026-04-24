const KEY = 'gemini_api_key';

/**
 * 读取 Gemini API Key：
 * 1. 优先读 localStorage（用户在 UI 配置过）
 * 2. 其次读构建时注入的 process.env.GEMINI_API_KEY（来自 .env.local）
 *    方便本地开发直接填环境变量，不用每次点弹窗
 *
 * 生产构建注意：.env.local 的值会被 Vite 打进 bundle。如果构建出来的
 * 产物要对外分发，不要把 key 放在 .env.local 里。
 */
export function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  const stored = window.localStorage.getItem(KEY);
  if (stored && stored.length > 0) return stored;
  const fromEnv =
    typeof process !== 'undefined' &&
    typeof process.env !== 'undefined' &&
    typeof process.env.GEMINI_API_KEY === 'string'
      ? process.env.GEMINI_API_KEY
      : '';
  return fromEnv;
}

export function setApiKey(value: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = value.trim();
  if (trimmed) {
    window.localStorage.setItem(KEY, trimmed);
  } else {
    window.localStorage.removeItem(KEY);
  }
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}
