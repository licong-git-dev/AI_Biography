/**
 * localStorage 使用量估算 + quota 错误处理。
 * 浏览器通常给 localStorage 5-10MB 配额。大 base64（参考图 / 关键帧）容易把它吃满。
 */

const WARN_THRESHOLD_BYTES = 4 * 1024 * 1024; // 4 MB
const HARD_LIMIT_BYTES = 5 * 1024 * 1024; // 典型浏览器硬顶 5 MB

export interface StorageHealth {
  usedBytes: number;
  usedMB: number;
  warnThresholdMB: number;
  hardLimitMB: number;
  near: boolean; // usedBytes > WARN_THRESHOLD_BYTES
  critical: boolean; // usedBytes > hardLimitBytes * 0.95
}

export function estimateStorageUsage(): StorageHealth {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      usedBytes: 0,
      usedMB: 0,
      warnThresholdMB: WARN_THRESHOLD_BYTES / 1024 / 1024,
      hardLimitMB: HARD_LIMIT_BYTES / 1024 / 1024,
      near: false,
      critical: false,
    };
  }
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) ?? '';
    // UTF-16 in-memory, but serialized bytes approx 2 per char for non-ASCII
    // Use length as a reasonable proxy for worst-case byte count.
    total += key.length + value.length;
  }
  const usedBytes = total;
  return {
    usedBytes,
    usedMB: +(usedBytes / 1024 / 1024).toFixed(2),
    warnThresholdMB: WARN_THRESHOLD_BYTES / 1024 / 1024,
    hardLimitMB: HARD_LIMIT_BYTES / 1024 / 1024,
    near: usedBytes > WARN_THRESHOLD_BYTES,
    critical: usedBytes > HARD_LIMIT_BYTES * 0.95,
  };
}

export function isQuotaExceeded(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  // Chrome: QuotaExceededError · Firefox: NS_ERROR_DOM_QUOTA_REACHED
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    /quota/i.test(e.message)
  );
}

/**
 * 移除所有角色 / 镜头里的 base64 图像字段（保留结构化文本），腾出空间。
 * 作为 quota 兜底手段，图像必须重新生成。
 */
export function evictBase64Images(): number {
  if (typeof window === 'undefined') return 0;
  let freed = 0;

  const keys = ['licong-characters', 'licong-shots'];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const state = parsed?.state;
      if (!state) continue;

      let changed = false;
      if (Array.isArray(state.characters)) {
        state.characters = state.characters.map((c: Record<string, unknown>) => {
          if (typeof c.referenceImageUrl === 'string' && c.referenceImageUrl.startsWith('data:')) {
            freed += (c.referenceImageUrl as string).length;
            changed = true;
            return { ...c, referenceImageUrl: undefined };
          }
          return c;
        });
      }
      if (Array.isArray(state.shots)) {
        state.shots = state.shots.map((s: Record<string, unknown>) => {
          if (typeof s.keyframeUrl === 'string' && s.keyframeUrl.startsWith('data:')) {
            freed += (s.keyframeUrl as string).length;
            changed = true;
            return { ...s, keyframeUrl: undefined, genStatus: '未生成' };
          }
          return s;
        });
      }
      if (changed) {
        localStorage.setItem(key, JSON.stringify(parsed));
      }
    } catch {
      // 忽略损坏条目
    }
  }

  return freed;
}
