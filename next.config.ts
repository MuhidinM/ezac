import type { NextConfig } from "next";

// `next build` and `next start` both run with NODE_ENV=production; `next dev` does not.
const isProduction = process.env.NODE_ENV === "production";

/**
 * Enforced on every response. These directives can't break a page: they stop
 * other sites framing ours (clickjacking), stop an injected <base> tag
 * re-pointing relative URLs, and block plugins. The contact form posts to a
 * mailto: address, so form-action allows that scheme.
 */
const ENFORCED_CSP = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self' mailto:",
].join("; ");

/**
 * The full policy, in report-only mode: browsers report what it would block
 * to /bff/csp-report and block nothing. Enforce it once the reports are clean.
 *
 * - Scripts: Next.js inlines its bootstrap scripts. Nonces would remove
 *   'unsafe-inline' but force every page to render per request (no static
 *   pages, no ISR), so we accept 'unsafe-inline' for now.
 * - Google Maps (landing-page impact map) needs the hosts, 'unsafe-eval',
 *   blob: workers and inline styles listed in Google's CSP guide for the
 *   Maps JavaScript API.
 * - The landing-page video comes from CloudFront; the waqf campaign photos
 *   from Unsplash. Fonts are self-hosted by next/font. Cause, story and
 *   report media go through /bff/media, so they are 'self'.
 */
const REPORT_ONLY_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.ggpht.com https://*.googleusercontent.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.googleapis.com https://*.google.com https://*.gstatic.com data: blob:",
  "media-src 'self' https://d8j0ntlcm91z4.cloudfront.net",
  "frame-src https://*.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' mailto:",
  "frame-ancestors 'none'",
  "report-uri /bff/csp-report",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Older browsers ignore frame-ancestors; this covers them.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Field officers capture GPS on the assessment's verification step; nothing
  // uses the camera, microphone, payments or USB.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
  { key: "Content-Security-Policy", value: ENFORCED_CSP },
  ...(isProduction
    ? [
        // One year, this host only. Browsers ignore it over plain HTTP or with
        // certificate errors, so it only takes effect once HTTPS works.
        { key: "Strict-Transport-Security", value: "max-age=31536000" },
        // Dev mode needs eval and a websocket, which would flood the report log.
        { key: "Content-Security-Policy-Report-Only", value: REPORT_ONLY_CSP },
      ]
    : []),
];

// Files in public/ have no hash in their name, so Next serves them with
// max-age=0. A day (then a week of serving the old copy while refetching) is
// safe: a replaced logo shows up within a day.
const PUBLIC_ASSET_CACHE = [
  { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // proxy.ts runs on /bff/* (Origin check, password-change gate), so Next
    // buffers each write body up to this size and silently cuts anything
    // longer (default 10 MB). Keep it above MULTIPART_BODY_LIMIT in
    // lib/api/body.ts (25 MiB) so the BFF's own cap answers 413 instead.
    proxyClientMaxBodySize: 26 * 1024 * 1024,
    // Two root layouts (app/[lang] and app/(portal)): app/global-not-found.tsx
    // answers URLs that match neither.
    globalNotFound: true,
  },
  // No page uses next/image. Turning the optimizer off closes /_next/image,
  // which had unauthenticated advisories and would fetch for anyone.
  images: { unoptimized: true },
  async headers() {
    return [
      { source: "/(.*)", headers: SECURITY_HEADERS },
      // Images at the top of public/ (logos, backgrounds) and the legal documents.
      { source: "/:file([A-Za-z0-9_.-]+[.](?:png|jpe?g|svg|webp))", headers: PUBLIC_ASSET_CACHE },
      { source: "/legal/:file*", headers: PUBLIC_ASSET_CACHE },
    ];
  },
};

export default nextConfig;
