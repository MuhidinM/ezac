"use client";

import { useEffect, useState } from "react";

/**
 * One-time success notices carried across a navigation: the page that did the
 * work leaves a message for the page it opens next ("Registered Abebe K."
 * on the new profile, "Submitted for review" on the assessment), and that
 * page shows it once. Kept in this tab's sessionStorage under a key per
 * record, so a notice never shows on another record or in another tab.
 */
const PREFIX = "ezac_notice:";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // Storage blocked (private mode, policy): the notice is simply not shown.
    return null;
  }
}

/** Leave `message` for the page that shows record `key` (e.g. "beneficiary:42"). */
export function leaveNotice(key: string, message: string): void {
  try {
    storage()?.setItem(`${PREFIX}${key}`, message);
  } catch {
    // Quota or policy: the next page just shows no notice.
  }
}

/** The notice left for `key`, removed as it is read so it shows once. */
export function takeNotice(key: string): string | null {
  const store = storage();
  if (!store) return null;
  try {
    const message = store.getItem(`${PREFIX}${key}`);
    if (message !== null) store.removeItem(`${PREFIX}${key}`);
    return message || null;
  } catch {
    return null;
  }
}

/** Forget every notice not yet shown (they can name a household). */
export function clearNotices(): void {
  const store = storage();
  if (!store) return;
  try {
    const keys: string[] = [];
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    for (const key of keys) store.removeItem(key);
  } catch {
    // Nothing more to do.
  }
}

/**
 * The notice left for `key`, read after mount (sessionStorage isn't there
 * during server rendering), plus a setter for notices the page itself shows.
 */
export function useNotice(key: string | null): [string | null, (message: string | null) => void] {
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!key) return;
    const message = takeNotice(key);
    // Read once from sessionStorage after the page that left it navigated here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (message) setNotice(message);
  }, [key]);
  return [notice, setNotice];
}
