"use client";

import { useEffect, useRef, useState } from "react";

/** Track an element's width so SVG charts can lay out in real pixels. */
export function useWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(240, Math.round(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

/**
 * 0 / 25 / 50 … style ticks covering `max`. Counts can't be fractional, so by
 * default the step is a whole number (0, 1, 2 rather than 0, 0.5, 1).
 */
export function niceTicks(max: number, count = 4, { integer = true }: { integer?: boolean } = {}) {
  if (max <= 0) return [0, 1];
  const rough = max / count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * power).filter((s) => !integer || (Number.isInteger(s) && s >= 1));
  const step = candidates.find((s) => s >= rough) ?? (integer ? Math.max(1, Math.ceil(rough)) : rough);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) ticks.push(Math.round(value * 100) / 100);
  return ticks;
}
