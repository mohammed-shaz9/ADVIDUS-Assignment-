// localStorage is for small payloads only (user, last metrics). Lists never go here.
const CACHE_PREFIX = 'advidus_cache_';
const CACHE_VERSION_KEY = CACHE_PREFIX + '_version';
const CACHE_VERSION = '3'; // bump to invalidate all caches on deploy
const MAX_ENTRY_CHARS = 8 * 1024; // refuse anything bigger than ~8KB

const removeAll = () => {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch { /* localStorage unavailable */ }
};

// Auto-invalidate all caches when version changes (e.g. after deploy)
try {
  if (localStorage.getItem(CACHE_VERSION_KEY) !== CACHE_VERSION) {
    removeAll();
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
  }
} catch { /* localStorage unavailable */ }

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
      const raw = JSON.stringify({ data, timestamp: Date.now() } satisfies CacheEntry<T>);
      if (raw.length > MAX_ENTRY_CHARS) return;
      localStorage.setItem(CACHE_PREFIX + key, raw);
    } catch {
      // localStorage full or unavailable
    }
  },

  clear(key?: string): void {
    if (!key) return removeAll();
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch { /* localStorage unavailable */ }
  },
};
