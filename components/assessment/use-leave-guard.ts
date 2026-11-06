"use client";

import { useEffect, useRef } from "react";

import { guardedHref } from "@/lib/backoffice/leave-guard";

/**
 * While `active`, a click on any link to another page of the app (sidebar,
 * breadcrumb, header, a link in the page) is held back and handed to
 * `onAttempt` with its address, so the page can ask before unsaved changes
 * are lost. The click is caught before React sees it; preventing its default
 * also stops next/link, which skips clicks that are already handled.
 *
 * Covers links only: the browser's Back button and closing the tab are left
 * to the beforeunload prompt (tab close and reload) or not caught (Back).
 */
export function useLeaveGuard(active: boolean, onAttempt: (href: string) => void) {
  const attempt = useRef(onAttempt);
  useEffect(() => {
    attempt.current = onAttempt;
  });

  useEffect(() => {
    if (!active) return;
    function onClick(event: MouseEvent) {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = guardedHref(
        {
          href: anchor.href,
          target: anchor.getAttribute("target") ?? "",
          download: anchor.hasAttribute("download"),
          button: event.button,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          defaultPrevented: event.defaultPrevented,
        },
        window.location,
      );
      if (!href) return;
      event.preventDefault();
      attempt.current(href);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active]);
}
