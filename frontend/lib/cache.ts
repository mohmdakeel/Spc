// lib/cache.ts - tiny sessionStorage cache with TTL

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry<T> = {
  data: T;
  ts: number;
};

export function readCache<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed?.data || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > ttlMs) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T | null) {
  if (typeof window === 'undefined') return;
  try {
    if (data === null) {
      window.sessionStorage.removeItem(key);
      return;
    }
    const payload: CacheEntry<T> = { data, ts: Date.now() };
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    /* ignore cache errors */
  }
}
