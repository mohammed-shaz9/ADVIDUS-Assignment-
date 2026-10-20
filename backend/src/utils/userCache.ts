import { AuthUser } from '../types/index.js';

// 5s per-process cache of authenticated users: one DB read per user per 5s instead of one per request.
// Deactivation/deletion calls invalidateUser(), so the worst-case lag is 5s on other instances.
const TTL_MS = 5000;
const MAX = 10000;
const cache = new Map<string, { at: number; user: AuthUser }>();

export const getCachedUser = (id: string): AuthUser | undefined => {
  const e = cache.get(id);
  if (e && Date.now() - e.at < TTL_MS) return e.user;
  cache.delete(id);
  return undefined;
};

export const setCachedUser = (id: string, user: AuthUser): void => {
  if (cache.size >= MAX) cache.delete(cache.keys().next().value as string);
  cache.set(id, { at: Date.now(), user });
};

export const invalidateUser = (id: string): void => {
  cache.delete(id);
};
