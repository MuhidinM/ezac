"use client";

import { useEffect } from "react";

/**
 * Browser-tab titles for the staff portal: "<page> — EZAC staff", the same
 * shape as the dashboard layout's metadata template, so server and client
 * titles never double up. A title change is also what makes Next's route
 * announcer tell screen-reader users that a client navigation happened.
 *
 * The page's own title (usePageTitle, called by PageHeader) wins; the
 * dashboard header sets a fallback from the breadcrumb for pages without one.
 */
export const STAFF_TITLE_SUFFIX = " — EZAC staff";

let pageTitle: string | null = null;
let fallbackTitle: string | null = null;
let desired: string | null = null;
let observer: MutationObserver | null = null;

export function staffDocumentTitle(title: string): string {
  return `${title}${STAFF_TITLE_SUFFIX}`;
}

function enforce() {
  if (desired && document.title !== desired) document.title = desired;
}

/**
 * Next renders the layout metadata's <title> ("Staff portal — EZAC") and
 * re-renders it on navigation, sometimes after this page's effects ran. A
 * watch on <head> puts the page's title back whenever that happens.
 */
function apply() {
  if (typeof document === "undefined") return;
  const text = pageTitle ?? fallbackTitle;
  desired = text ? staffDocumentTitle(text) : null;
  enforce();
  if (desired && !observer && typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(enforce);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
  }
}

/**
 * Name the open page in the browser tab while it is mounted. Pass the
 * record's name on detail pages once it has loaded; null/empty leaves the
 * breadcrumb-based title in place.
 */
export function usePageTitle(title: string | null | undefined): void {
  const text = title?.trim() || null;
  useEffect(() => {
    if (!text) return;
    pageTitle = text;
    apply();
    return () => {
      if (pageTitle !== text) return;
      pageTitle = null;
      apply();
    };
  }, [text]);
}

/** For the dashboard header only: the title used when the page sets none. */
export function useFallbackPageTitle(title: string): void {
  useEffect(() => {
    fallbackTitle = title;
    apply();
  }, [title]);

  // Leaving the dashboard (e.g. for /login): stop overriding that page's own title.
  useEffect(
    () => () => {
      fallbackTitle = null;
      desired = null;
      observer?.disconnect();
      observer = null;
    },
    [],
  );
}
