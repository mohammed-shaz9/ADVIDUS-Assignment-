import { useEffect, useRef } from 'react';

// setInterval that pauses while the tab is hidden and fires once on return.
// Does not fire on mount: callers do their own initial fetch.
export const useVisibleInterval = (callback: () => void, ms: number, enabled = true) => {
  const cb = useRef(callback);
  useEffect(() => { cb.current = callback; });

  useEffect(() => {
    if (!enabled) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const stop = () => { clearInterval(id); id = undefined; };
    const start = () => { if (id === undefined) id = setInterval(() => cb.current(), ms); };
    const onVisibility = () => {
      if (document.hidden) { stop(); return; }
      cb.current();
      stop();
      start();
    };
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [ms, enabled]);
};
