const PREFIX = 'vb_';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

interface CacheEntry<T> {
  value: T;
  expires: number;
}

function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function cacheGet<T>(key: string): T | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expires) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  if (!isClient()) return;
  try {
    const entry: CacheEntry<T> = { value, expires: Date.now() + ttlMs };
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage 용량 초과 시 무시
  }
}
