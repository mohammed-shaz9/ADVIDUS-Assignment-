import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { memo } from '../src/utils/memo.js';

describe('memo', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('cache hit within TTL; separate entries per args', async () => {
    const fn = vi.fn(async (n: number) => n * 2);
    const m = memo(1000, fn);
    expect(await m(1)).toBe(2);
    expect(await m(1)).toBe(2);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(await m(2)).toBe(4);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('expires at TTL', async () => {
    const fn = vi.fn(async () => 'v');
    const m = memo(1000, fn);
    await m();
    vi.advanceTimersByTime(999);
    await m();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    await m();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('db down')).mockResolvedValue('ok');
    const m = memo(1000, fn);
    await expect(m()).rejects.toThrow('db down');
    expect(await m()).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(await m()).toBe('ok'); // success is cached
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('concurrent calls share one promise', async () => {
    let resolve!: (v: string) => void;
    const fn = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const m = memo(1000, fn);
    const a = m();
    const b = m();
    expect(a).toBe(b);
    resolve('done');
    expect(await Promise.all([a, b])).toEqual(['done', 'done']);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('caps entries at 50, evicting the oldest', async () => {
    const fn = vi.fn(async (n: number) => n);
    const m = memo(60_000, fn);
    for (let i = 0; i <= 50; i++) await m(i); // 51 distinct keys
    expect(fn).toHaveBeenCalledTimes(51);
    await m(50); // newest still cached
    expect(fn).toHaveBeenCalledTimes(51);
    await m(0); // oldest evicted
    expect(fn).toHaveBeenCalledTimes(52);
  });
});
