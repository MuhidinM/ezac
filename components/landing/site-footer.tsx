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
            <div className="flex flex-col gap-8">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: "#6F6F6F" }}
                  >
                    Mobile access
                  </p>
                  <h3
                    className="font-serif-display mt-2 text-3xl sm:text-4xl"
                    style={{ color: "#001539", letterSpacing: "-1px" }}
                  >
                    Get the citizen app
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-sm transition-colors hover:bg-black/2"
                    style={{ color: "#001539" }}
                  >
                    <SmartphoneIcon className="h-4 w-4" />
                    App Store
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-sm transition-colors hover:bg-black/2"
                    style={{ color: "#001539" }}
                  >
                    <PlayCircleIcon className="h-4 w-4" />
                    Google Play
                  </button>
                </div>
              </div>

              <div className="h-px w-full bg-black/10" />

              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
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

              <div className="h-px w-full bg-black/10" />

              <p className="text-xs" style={{ color: "#6F6F6F" }}>
                This system is developed and sponsored by DX Valley.
              </p>

              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
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
                <p className="text-xs" style={{ color: "#6F6F6F" }}>
                  &copy; {new Date().getFullYear()} EZAC. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
