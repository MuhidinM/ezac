import {
  GlobeIcon,
  MessageCircleIcon,
  PlayCircleIcon,
  Share2Icon,
  SmartphoneIcon,
  VideoIcon,
} from "lucide-react";

const FOOTER_LINKS = [
  "Privacy Policy",
  "FAQ",
  "Fatwas / Islamic Rulings on Zakat",
  "Contact Support",
];

const SOCIALS = [
  { name: "Facebook", icon: GlobeIcon },
  { name: "Instagram", icon: MessageCircleIcon },
  { name: "LinkedIn", icon: Share2Icon },
  { name: "YouTube", icon: VideoIcon },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 w-full bg-white">
      <div className="mx-auto max-w-7xl px-8 pt-0 pb-16">
        <div className="rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5">
          <div className="rounded-2xl border border-black/5 px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- brand mark served as a static asset */}
                  <img src="/logo.svg" alt="EZAC" className="h-9 w-auto" />
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
                <div className="flex items-center gap-2">
                  {SOCIALS.map(({ name, icon: Icon }) => (
                    <a
                      key={name}
                      href="#"
                      aria-label={name}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 transition-colors hover:bg-black/2"
                      style={{ color: "#6F6F6F" }}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
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
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm transition-colors hover:bg-black/2"
                    style={{ color: "#001539" }}
                  >
                    <SmartphoneIcon className="h-4 w-4" />
                    App Store
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm transition-colors hover:bg-black/2"
                    style={{ color: "#001539" }}
                  >
                    <PlayCircleIcon className="h-4 w-4" />
                    Google Play
                  </button>
                </div>
              </div>

              <nav className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-8 md:flex md:flex-wrap md:gap-x-6">
                {FOOTER_LINKS.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-sm transition-colors hover:text-[#001539]"
                    style={{ color: "#6F6F6F" }}
                  >
                    {link}
                  </a>
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
                  className="text-xs transition-colors hover:text-[#001539]"
                  style={{ color: "#6F6F6F" }}
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
