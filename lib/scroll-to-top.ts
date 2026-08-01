export function scrollDashboardToTop(): void {
  if (typeof window === "undefined") return;
  const main = document.querySelector("main.overflow-y-auto");
  main?.scrollTo({ top: 0, behavior: "instant" });
}
