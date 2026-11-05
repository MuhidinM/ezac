import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightIcon,
  BarChart3Icon,
  LanguagesIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";

import { type Locale, localizedPath } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type ItemKey = keyof Dictionary["home"]["trustStrip"]["items"];

const ITEMS: { key: ItemKey; icon: LucideIcon }[] = [
  { key: "nisab", icon: TrendingUpIcon },
  { key: "households", icon: ShieldCheckIcon },
  { key: "qr", icon: WalletIcon },
  { key: "languages", icon: LanguagesIcon },
  { key: "dashboard", icon: BarChart3Icon },
];

export function TrustStrip({ t, locale }: { t: Dictionary["home"]["trustStrip"]; locale: Locale }) {
  return (
    <section aria-labelledby="trust-strip-title" className="relative z-10 w-full border-t border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-8 py-14">
        <div className="mb-10 flex items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-ink">{t.eyebrow}</p>
            <h2
              id="trust-strip-title"
              className="font-serif-display mt-2 text-2xl tracking-[-0.5px] text-navy sm:text-3xl"
            >
              {t.title}
            </h2>
          </div>
          <Link
            href={localizedPath(locale, "/how-it-works")}
            title={t.link.title}
            className="hidden shrink-0 items-center gap-1.5 rounded-sm text-sm text-muted-ink transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 md:inline-flex"
          >
            {t.link.label}
            <ArrowRightIcon aria-hidden="true" className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </Link>
        </div>

        <ul className="grid grid-cols-2 divide-x divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 md:grid-cols-3 md:divide-y-0 lg:grid-cols-5">
          {ITEMS.map(({ key, icon: Icon }) => (
            <li key={key} className="flex flex-col gap-3 p-6 transition-colors hover:bg-black/[0.02]">
              <Icon aria-hidden="true" className="h-5 w-5 text-navy" />
              <div>
                <p className="text-sm font-medium text-navy">{t.items[key].label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-ink">{t.items[key].sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
