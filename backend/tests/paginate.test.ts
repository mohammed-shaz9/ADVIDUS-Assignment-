import { describe, it, expect } from 'vitest';
import { parsePage, pageResult, escapeRegex, str, oneOf } from '../src/utils/paginate.js';

describe('parsePage', () => {
  it('defaults', () => {
    expect(parsePage({})).toEqual({ page: 1, limit: 25, skip: 0 });
  });

  it('custom default and max', () => {
    expect(parsePage({}, 50)).toMatchObject({ limit: 50 });
    expect(parsePage({ limit: '9999' }, 50, 500).limit).toBe(500);
    expect(parsePage({ limit: '9999' }).limit).toBe(100);
  });

  it('skip = (page-1)*limit', () => {
    expect(parsePage({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it.each([['abc'], [''], ['0'], ['-3'], [undefined], [null], [NaN]])('page %s -> 1', (page) => {
    expect(parsePage({ page }).page).toBe(1);
  });

  it.each([['abc'], [''], ['0'], [undefined], [NaN]])('limit %s -> default', (limit) => {
    expect(parsePage({ limit }, 30).limit).toBe(30);
  });

  it('negative limit clamps to 1', () => {
    expect(parsePage({ limit: '-5' }).limit).toBe(1);
  });

  it('truncates decimals', () => {
    expect(parsePage({ page: '2.9', limit: '10.7' })).toMatchObject({ page: 2, limit: 10 });
  });
});

describe('pageResult', () => {
  it('shape', () => {
    const r = pageResult([1, 2], 2, 1, 25);
    expect(r).toMatchObject({ items: [1, 2], page: 1, limit: 25, total: 2, totalPages: 1 });
    expect(new Date(r.serverTime).toISOString()).toBe(r.serverTime);
  });

  it('totalPages is at least 1 when empty', () => {
    expect(pageResult([], 0, 1, 25).totalPages).toBe(1);
  });

  it('totalPages rounds up', () => {
    expect(pageResult([], 100, 1, 50).totalPages).toBe(2);
    expect(pageResult([], 101, 1, 50).totalPages).toBe(3);
  });
});

describe('escapeRegex', () => {
  const SPECIAL = '.*+?^${}()|[]\\'.split('');

  it.each(SPECIAL)('escapes %s', (c) => {
    expect(escapeRegex(c)).toBe('\\' + c);
    expect(new RegExp(`^${escapeRegex(c)}$`).test(c)).toBe(true);
  });

  it('all specials together match themselves literally', () => {
    const all = SPECIAL.join('');
    expect(new RegExp(`^${escapeRegex(all)}$`).test(all)).toBe(true);
  });

  it('leaves ordinary text alone; escaped pattern is not a wildcard', () => {
    expect(escapeRegex('abc 123_@-')).toBe('abc 123_@-');
    expect(new RegExp(escapeRegex('a.c')).test('abc')).toBe(false);
  });
});

describe('str', () => {
  it('accepts and trims non-empty strings', () => {
    expect(str('  hi ')).toBe('hi');
  });

  it.each([[''], ['   '], [undefined], [null], [5], [true], [['a']], [{ $ne: 'x' }]])('rejects %j', (v) => {
    expect(str(v)).toBeUndefined();
  });
});

describe('oneOf', () => {
  const ROLES = ['admin', 'user'] as const;

  it('returns allowed value', () => {
    expect(oneOf('admin', ROLES)).toBe('admin');
  });

  it.each([['root'], ['ADMIN'], [''], [undefined], [['admin']], [{}], [1]])('rejects %j', (v) => {
    expect(oneOf(v, ROLES)).toBeUndefined();
  });
});
