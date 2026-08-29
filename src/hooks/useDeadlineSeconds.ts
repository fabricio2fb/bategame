'use client';

import { useEffect, useState } from 'react';

/** Keeps a visible countdown synchronized with an authoritative deadline. */
export function useDeadlineSeconds(deadlineAt: number | null, active: boolean): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!deadlineAt || !active) {
      setSeconds(0);
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;

    const update = () => {
      if (cancelled) return;
      const remainingMs = deadlineAt - Date.now();
      const nextSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      setSeconds((current) => (current === nextSeconds ? current : nextSeconds));

      if (nextSeconds > 0) {
        const untilNextSecond = Math.max(16, remainingMs - (nextSeconds - 1) * 1000);
        timeoutId = window.setTimeout(update, untilNextSecond);
      }
    };

    update();
    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [active, deadlineAt]);

  return seconds;
}
