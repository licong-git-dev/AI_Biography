const KEY = 'gemini_api_key';

export function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(KEY) ?? '';
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
