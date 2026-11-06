"use client";

import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { CheckIcon, ChevronDownIcon, GlobeIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_NAMES,
  LOCALE_SHORT,
  type Locale,
  localeDirection,
  localizedPath,
  splitLocale,
} from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

type LanguageOption = {
  locale: Locale;
  name: string;
  href: string;
  current: boolean;
  title: string;
};

/** The current page in every language, with the visitor's own first in line. */
function useLanguageOptions(): LanguageOption[] {
  const { locale, common } = useI18n();
  // "/am/about" or "/about" (English, or "/en/about" behind the rewrite) -> "/about".
  const { path } = splitLocale(usePathname() || "/");
  return LOCALES.map((option) => ({
    locale: option,
    name: LOCALE_NAMES[option],
    // English links to "/en/about", not "/about": proxy.ts treats that as an
    // explicit choice (saves it and redirects to "/about"), so English opened
    // in a new tab isn't sent back to an earlier language the cookie remembers.
    href: option === DEFAULT_LOCALE ? `/${DEFAULT_LOCALE}${path === "/" ? "" : path}` : localizedPath(option, path),
    current: option === locale,
    title: format(common.language.switchTo, { language: LOCALE_NAMES[option] }),
  }));
}

/**
 * Remembers the choice for proxy.ts (English too, so a visitor who switches
 * back isn't sent to their old language) and keeps the query string and hash.
 * A full page load, not a client navigation: the language changes the whole
 * document (lang, dir, fonts), and a prefetched page made before the cookie
 * changed could be in the old language.
 */
function chooseLanguage(event: MouseEvent<HTMLAnchorElement>, option: LanguageOption) {
  // Let the browser handle new-tab, new-window and download clicks itself, and
  // leave the saved language alone for them: the cookie is shared by every
  // tab, so a visitor who only peeks at another language in a new tab would
  // otherwise see this tab jump to that language on its next link.
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  document.cookie = `${LOCALE_COOKIE}=${option.locale}; path=/; max-age=31536000; samesite=lax`;
  event.preventDefault();
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full load on purpose (see above)
  window.location.assign(`${option.href}${window.location.search}${window.location.hash}`);
}

function LanguageName({ option }: { option: LanguageOption }) {
  return (
    <span lang={option.locale} dir={localeDirection(option.locale)}>
      {option.name}
    </span>
  );
}

/** The navbar's language menu (md screens and up). */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, dir, common } = useI18n();
  const options = useLanguageOptions();

  return (
    <DropdownMenu dir={dir} modal={false}>
      <DropdownMenuTrigger
        title={common.language.choose}
        className={cn(
          "group flex items-center gap-1.5 rounded-sm text-xs text-muted-ink transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 data-[state=open]:text-navy",
          className,
        )}
      >
        <GlobeIcon aria-hidden="true" className="h-3.5 w-3.5" />
        {/* The name starts with the visible code, so speech users can say what they see. */}
        <span lang={locale} className="font-medium text-navy">
          {LOCALE_SHORT[locale]}
        </span>
        <span className="sr-only">
          {" "}
          ({common.language.label}: <span lang={locale}>{LOCALE_NAMES[locale]}</span>)
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-auto min-w-44 rounded-xl border border-black/5 bg-white p-1.5 shadow-lg shadow-black/5">
        <DropdownMenuLabel className="px-2.5 text-xs font-normal text-muted-ink">{common.language.choose}</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuItem key={option.locale} asChild className="cursor-pointer rounded-lg px-2.5 py-2 text-sm text-navy">
            <a
              href={option.href}
              hrefLang={option.locale}
              title={option.title}
              aria-current={option.current ? "true" : undefined}
              onClick={(event) => chooseLanguage(event, option)}
              className={`flex items-center justify-between gap-4 ${option.current ? "font-medium" : ""}`}
            >
              <LanguageName option={option} />
              {option.current ? <CheckIcon aria-hidden="true" className="h-4 w-4 text-brand" /> : null}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** All languages as plain links, for the mobile menu. */
export function LanguageList({ onChoose }: { onChoose?: () => void }) {
  const { common } = useI18n();
  const options = useLanguageOptions();

  return (
    <nav aria-label={common.language.label}>
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-brand">
        <GlobeIcon aria-hidden="true" className="h-3.5 w-3.5" />
        {common.language.label}
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-2">
        {options.map((option) => (
          <li key={option.locale}>
            <a
              href={option.href}
              hrefLang={option.locale}
              title={option.title}
              aria-current={option.current ? "true" : undefined}
              onClick={(event) => {
                onChoose?.();
                chooseLanguage(event, option);
              }}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm text-navy transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                option.current ? "border-brand font-medium" : "border-black/10"
              }`}
            >
              <LanguageName option={option} />
              {option.current ? <CheckIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-brand" /> : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
