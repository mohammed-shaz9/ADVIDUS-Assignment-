import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Runs `refetch` once per `delay` window after any of `events` arrives
// (coalesced, so a burst of events costs one request and can't starve).
// Pass a module-level `events` array so its identity is stable.
export const useSocketRefetch = (events: readonly string[], refetch: () => void, delay = 1500, enabled = true) => {
  const { socket } = useAuth();
  const fn = useRef(refetch);
  useEffect(() => { fn.current = refetch; });

  useEffect(() => {
    if (!socket || !enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onEvent = () => {
      if (timer !== undefined) return;
      timer = setTimeout(() => { timer = undefined; fn.current(); }, delay);
    };
    events.forEach(e => socket.on(e, onEvent));
    return () => {
      clearTimeout(timer);
      events.forEach(e => socket.off(e, onEvent));
    };
  }, [socket, events, delay, enabled]);
};
