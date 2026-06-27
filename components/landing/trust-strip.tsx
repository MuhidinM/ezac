import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  LanguagesIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";

type TrustItem = {
  icon: LucideIcon;
  label: string;
  sub: string;
};

const ITEMS: TrustItem[] = [
  {
    icon: TrendingUpIcon,
    label: "Live Nisab Pricing",
    sub: "Refreshed every 60 seconds",
  },
  {
    icon: ShieldCheckIcon,
    label: "Fayda ID Verified",
    sub: "National ID integration",
  },
  {
    icon: WalletIcon,
    label: "Mobile Money & Bank",
    sub: "Telebirr · CBE · Visa",
  },
  {
    icon: LanguagesIcon,
    label: "4 Regional Languages",
    sub: "Amharic · Oromo · Arabic · EN",
  },
  {
    icon: BarChart3Icon,
    label: "Real-Time Dashboard",
    sub: "Public, audited, traceable",
  },
];

export function TrustStrip() {
  return (
    <section className="relative z-10 w-full border-t border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-8 py-14">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: "#6F6F6F" }}
            >
              Built on trusted infrastructure
            </p>
            <h2
              className="font-serif-display mt-2 text-2xl sm:text-3xl"
              style={{
                color: "#001539",
                letterSpacing: "-0.5px",
              }}
            >
              Precision, transparency, accessibility.
            </h2>
          </div>
          <a
            href="/about/shariah-board"
            className="hidden text-sm transition-colors hover:text-[#001539] md:inline"
            style={{ color: "#6F6F6F" }}
          >
            Read the standards →
          </a>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 md:grid-cols-3 md:divide-y-0 lg:grid-cols-5">
          {ITEMS.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-col gap-3 p-6 transition-colors hover:bg-black/[0.02]"
            >
              <Icon className="h-5 w-5" style={{ color: "#001539" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "#001539" }}>
                  {label}
                </p>
                <p
                  className="mt-1 text-xs leading-relaxed"
                  style={{ color: "#6F6F6F" }}
                >
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
