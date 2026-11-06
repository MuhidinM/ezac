import { installClientErrorReporting } from "@/components/errors/report-client-error";

/**
 * Runs in the browser before the page becomes interactive, on the public site
 * and the staff portal alike. Uncaught errors and unhandled promise
 * rejections are reported to our own server log (POST /bff/client-error);
 * errors the error pages catch are reported by useLoggedError. Keep this
 * small: it delays every page's start.
 */
try {
  installClientErrorReporting();
} catch {
  // Monitoring must never stop the page from loading.
}
