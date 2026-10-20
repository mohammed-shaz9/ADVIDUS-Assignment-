import { useEffect, useRef, useState, useCallback } from 'react';
import type { Paged } from '../types';

interface Result<T> { key: string; data: Paged<T> | null; error: string | null }

// Server-side paged list. `filterKey` must change whenever filters change (resets to page 1).
// Stale / out-of-order responses are dropped via AbortController.
export const usePagedList = <T>(
  fetcher: (page: number, signal: AbortSignal) => Promise<Paged<T>>,
  filterKey: string,
) => {
  const [page, setPage] = useState(1);
  const [nonce, setNonce] = useState(0);
  const [prevFilter, setPrevFilter] = useState(filterKey);
  const [res, setRes] = useState<Result<T>>({ key: '', data: null, error: null });
  const fetchRef = useRef(fetcher);
  useEffect(() => { fetchRef.current = fetcher; });

  if (prevFilter !== filterKey) {
    setPrevFilter(filterKey);
    setPage(1);
  }

  const reqKey = `${filterKey}|${page}|${nonce}`;

  useEffect(() => {
    const ctl = new AbortController();
    fetchRef.current(page, ctl.signal)
      .then(data => {
        if (ctl.signal.aborted) return;
        setRes({ key: reqKey, data, error: null });
        // Page vanished (e.g. last row deleted): step back.
        if (data.items.length === 0 && page > 1 && data.totalPages < page) setPage(Math.max(1, data.totalPages));
      })
      .catch(err => {
        if (ctl.signal.aborted) return;
        setRes(r => ({ key: reqKey, data: r.data, error: err instanceof Error ? err.message : 'Failed to load' }));
      });
    return () => ctl.abort();
  }, [reqKey, page]);

  const reload = useCallback(() => setNonce(n => n + 1), []);
  const current = res.key === reqKey;
  return {
    data: res.data,
    loading: !current,
    error: current ? res.error : null,
    page,
    setPage,
    reload,
  };
};
