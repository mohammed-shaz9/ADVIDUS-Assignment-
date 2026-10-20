import { useCallback, useEffect, useRef } from 'react';

// Returns a function that aborts the previous request and hands out a fresh
// AbortSignal, so only the newest response is applied. Aborts on unmount too.
export const useLatestSignal = () => {
  const ctl = useRef<AbortController | null>(null);
  useEffect(() => () => ctl.current?.abort(), []);
  return useCallback(() => {
    ctl.current?.abort();
    ctl.current = new AbortController();
    return ctl.current.signal;
  }, []);
};
