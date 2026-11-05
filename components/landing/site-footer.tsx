import Link from "next/link";
import { DownloadIcon } from "lucide-react";

import { CITIZEN_APP_DOWNLOAD_URL } from "@/lib/constants/app-download";

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "FAQ", href: "/faq" },
  { label: "Fatwas / Islamic Rulings on Zakat", href: "/fatwas" },
  { label: "Contact Support", href: "/contact" },
];

// Social links are left out until the Commission confirms its official
// accounts; add them here (with the right brand icons) once it does.

export function SiteFooter() {
  return (
    <footer className="relative z-10 w-full bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-0 pb-16 sm:px-8">
        <div className="rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5">
          <div className="rounded-2xl border border-black/5 px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-10">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- brand mark served as a static asset */}
                <img src="/logo.svg" alt="" className="h-9 w-auto" />
                <span className="flex flex-col leading-tight">
                  <span
                    className="font-serif-display text-lg tracking-tight"
                    style={{ color: "#001539" }}
                  >
                    EZAC
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: "#6F6F6F" }}
                  >
                    Ethiopian Zakat &amp; Awqaf Commission
                  </span>
                </span>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-black/2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: "#6F6F6F" }}
                  >
                    Mobile access
                  </p>
                  <p
                    className="font-serif-display mt-1.5 text-2xl sm:text-3xl"
                    style={{ color: "#001539", letterSpacing: "-0.5px" }}
                  >
                    Get the citizen app
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "#6F6F6F" }}>
                    For Android phones only. The app is a direct download (APK
                    file), not from an app store.
                  </p>
                </div>
                {/* One honest button: the only build is an Android APK, so no store badges. */}
                <a
                  href={CITIZEN_APP_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm transition-colors hover:bg-black/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2"
                  style={{ color: "#001539" }}
                >
                  <DownloadIcon className="h-4 w-4" />
                  Download the Android app
                  <span className="sr-only">(APK file, opens in a new tab)</span>
                </a>
              </div>

              <nav
                aria-label="Footer"
                className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-8 md:flex md:flex-wrap md:gap-x-6"
              >
                {FOOTER_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm transition-colors hover:text-[#001539]"
                    style={{ color: "#6F6F6F" }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-col gap-2 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs" style={{ color: "#6F6F6F" }}>
                  &copy; {new Date().getFullYear()} EZAC. All rights reserved.
                </p>
                <a
                  href="https://dxvalley.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs transition-colors hover:text-[#007050]"
                  style={{ color: "#e18f35" }}
                >
                  Developed and sponsored by DX Valley.
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
