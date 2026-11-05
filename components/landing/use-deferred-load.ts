"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Helpers for the landing page's heavy extras (hero video, sparkles, map):
 * they wait until the page has loaded and the browser is idle, and only run
 * where the screen, motion setting and connection suit them.
 */

/** Whether a media query matches. False during the server render and first paint. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

type NetworkInformation = EventTarget & { saveData?: boolean; effectiveType?: string };

function connection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

function subscribeConnection(onChange: () => void) {
  const info = connection();
  info?.addEventListener?.("change", onChange);
  return () => info?.removeEventListener?.("change", onChange);
}

/**
 * True on a fast connection without data saver (Network Information API:
 * effectiveType "4g"). Browsers without the API (Safari, Firefox) report
 * nothing about the connection, so they count as fast.
 */
export function useFastConnection(): boolean {
  return useSyncExternalStore(
    subscribeConnection,
    () => {
      const info = connection();
      if (!info) return true;
      return !info.saveData && (info.effectiveType === undefined || info.effectiveType === "4g");
    },
    () => false,
  );
}

/**
 * Becomes true once the page has finished loading and the browser has an idle
 * moment (or after `timeout` ms of waiting for one). Stays false while
 * `enabled` is false.
 */
export function useIdleAfterLoad(enabled = true, timeout = 4000): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled || ready) return;
    let idleId: number | null = null;
    let timerId: number | null = null;

    const markReady = () => setReady(true);
    const waitForIdle = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(markReady, { timeout });
      } else {
        timerId = window.setTimeout(markReady, 1500);
      }
    };

    if (document.readyState === "complete") waitForIdle();
    else window.addEventListener("load", waitForIdle, { once: true });

    return () => {
      window.removeEventListener("load", waitForIdle);
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [enabled, ready, timeout]);

  return ready;
}

/** Becomes true once the element comes within `margin` of the viewport, and stays true. */
export function useNearViewport(ref: React.RefObject<Element | null>, enabled = true, margin = "400px 0px"): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || near || !element) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(() => setNear(true), 0);
      return () => window.clearTimeout(id);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled, near, margin]);

  return near;
}
