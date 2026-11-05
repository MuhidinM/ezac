export function scrollDashboardToTop(): void {
  if (typeof window === "undefined") return;
  // The dashboard's scroll area is the skip link's target (app/dashboard/layout.tsx).
  const main = document.getElementById("main");
  main?.scrollTo({ top: 0, behavior: "instant" });
}
