/**
 * Which link clicks leave the page for another page of this app, so a form
 * with unsaved changes can ask first. Pure, for tests; the hook that listens
 * for clicks is components/assessment/use-leave-guard.ts.
 */

export type LinkClick = {
  /** The anchor's resolved href (anchor.href), e.g. "https://host/dashboard/x". */
  href: string;
  /** The anchor's target attribute ("" when none). */
  target: string;
  /** Whether the anchor has a download attribute. */
  download: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  /** Something else already handled the click. */
  defaultPrevented: boolean;
};

export type CurrentPage = { origin: string; pathname: string; search: string };

/**
 * The in-app address ("/dashboard/x?y=1#z") the click would open in this tab,
 * or null when it doesn't leave the page: a modified or middle click, a new
 * tab, a download, another site or scheme, or a link to this same page.
 */
export function guardedHref(click: LinkClick, current: CurrentPage): string | null {
  if (click.defaultPrevented || click.button !== 0) return null;
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return null;
  if (click.download || (click.target && click.target !== "_self")) return null;

  let url: URL;
  try {
    url = new URL(click.href, current.origin);
  } catch {
    return null;
  }
  if (url.origin !== current.origin) return null;
  // Same page (a #section link, or this page itself): nothing is lost.
  if (url.pathname === current.pathname && url.search === current.search) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}
