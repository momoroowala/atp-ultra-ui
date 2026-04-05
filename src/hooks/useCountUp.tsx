import { useState, useEffect, useRef } from 'react';

const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

export function useCountUp(target: number, duration = 800, enabled = true): number {
  const [value, setValue] = useState(prefersReducedMotion || !enabled ? target : 0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || prefersReducedMotion || !enabled) {
      setValue(target);
      return;
    }
    hasRun.current = true;

    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);

  return value;
}
