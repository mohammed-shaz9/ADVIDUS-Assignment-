// Shared list helpers: every list endpoint goes through parsePage + pageResult so no query is unbounded.
export const parsePage = (q: { page?: unknown; limit?: unknown }, def = 25, max = 100) => {
  const page = Math.max(parseInt(String(q.page), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(q.limit), 10) || def, 1), max);
  return { page, limit, skip: (page - 1) * limit };
};

export const pageResult = <T>(items: T[], total: number, page: number, limit: number) => ({
  items,
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
  serverTime: new Date().toISOString(),
});

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Query-string values can be arrays/objects (?q[$ne]=x) — accept plain non-empty strings only.
export const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined;

// Returns v only if it is one of the allowed values (enum filter from the query string).
export const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  allowed.find((a) => a === v);
