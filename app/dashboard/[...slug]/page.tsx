import { notFound } from "next/navigation";

// Unknown /dashboard/* addresses show the portal's own 404 (inside the sidebar
// layout) instead of the public site's. Real routes are more specific and win.
export default function UnknownDashboardPage() {
  notFound();
}
