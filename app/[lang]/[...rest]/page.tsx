import { notFound } from "next/navigation";

// An unknown public URL ("/about/typo", or "/am/typo") shows the localized 404
// in app/[lang]/not-found.tsx, inside the site's layout. Real routes are more
// specific and win.
export default function UnknownPublicPage() {
  notFound();
}
