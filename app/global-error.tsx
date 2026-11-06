"use client"; // Error boundaries must be Client Components.

import { useLoggedError } from "@/components/errors/use-logged-error";

/**
 * Last-resort page, shown only when the root layout itself fails. It replaces
 * the whole document, so it brings its own <html> and <body> and uses inline
 * styles and system fonts: the app's stylesheet and fonts may be what failed.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const reference = useLoggedError("global", error);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          boxSizing: "border-box",
          backgroundColor: "#FFFFFF",
          color: "#001539",
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <title>Something went wrong — EZAC</title>
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#007050" }}>
            Ethiopian Zakat &amp; Awqaf Commission
          </p>
          <h1 style={{ margin: "12px 0 0", fontSize: "28px", lineHeight: 1.2, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ margin: "12px 0 0", fontSize: "15px", lineHeight: 1.6, color: "#4a4a4a" }}>
            The problem is on our side, not yours. Try again in a moment.
          </p>
          <div style={{ marginTop: "24px", display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => retry()}
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: "#007050",
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* A plain link: a full page load rebuilds the document from scratch. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the root layout failed; reload the whole document */}
            <a
              href="/"
              style={{
                borderRadius: "999px",
                padding: "12px 24px",
                fontSize: "14px",
                border: "1px solid rgba(0,0,0,0.15)",
                color: "#001539",
                textDecoration: "none",
              }}
            >
              Go to the home page
            </a>
          </div>
          {reference ? (
            <p style={{ margin: "24px 0 0", fontSize: "12px", color: "#6F6F6F" }}>
              Reference: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", color: "#001539" }}>{reference}</span>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
