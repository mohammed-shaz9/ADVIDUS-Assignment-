const CACHE_PREFIX = 'advidus_cache_';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 min before considered stale

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const cache = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      return entry.data;
    } catch {
      return null;
    }
  },

  set<T>(key: string, data: T): void {
    try {
      const entry: CacheEntry<T> = { data, timestamp: Date.now() };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // localStorage full or unavailable
    }
  },

  isStale(key: string): boolean {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return true;
      const entry: CacheEntry<unknown> = JSON.parse(raw);
      return Date.now() - entry.timestamp > CACHE_DURATION_MS;
    } catch {
      return true;
    }
  },

  clear(key?: string): void {
    if (key) {
      localStorage.removeItem(CACHE_PREFIX + key);
    } else {
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    }
  },
};
