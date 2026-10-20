// Tiny TTL memo. Caches the promise, so concurrent callers share one DB query; failures are not cached.
// ponytail: per-process only — behind several instances use Redis if staleness matters.
export const memo = <A extends unknown[], T>(ttlMs: number, fn: (...a: A) => Promise<T>) => {
  const hit = new Map<string, { at: number; p: Promise<T> }>();
  return (...a: A): Promise<T> => {
    const k = JSON.stringify(a);
    const e = hit.get(k);
    if (e && Date.now() - e.at < ttlMs) return e.p;
    const p = fn(...a);
    hit.set(k, { at: Date.now(), p });
    p.catch(() => hit.delete(k));
    if (hit.size > 50) hit.delete(hit.keys().next().value as string);
    return p;
  };
};
