"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, MenuIcon, XIcon } from "lucide-react";

import { LanguageList, LanguageSwitcher } from "@/components/site/language-switcher";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { splitLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type NavStrings = Dictionary["common"]["nav"];
type LinkKey = keyof NavStrings["links"];
type GroupKey = keyof NavStrings["groups"];

/** Where each menu entry goes; the labels and tooltips live in common.nav. */
const MENU: { group: GroupKey; links: { key: LinkKey; href: string }[] }[] = [
  {
    group: "zakat",
    links: [
      { key: "calculator", href: "/zakat/calculator" },
      { key: "pay", href: "/zakat/pay" },
      { key: "causes", href: "/causes" },
      { key: "corporate", href: "/zakat/corporate" },
    ],
  },
  {
    group: "waqf",
    links: [
      { key: "waqfCrowdfunding", href: "/waqf/crowdfunding" },
      { key: "waqfInvestments", href: "/waqf/investments" },
      { key: "waqfRegister", href: "/waqf/register-asset" },
    ],
  },
  {
    group: "transparency",
    links: [
      { key: "dashboard", href: "/transparency/dashboard" },
      { key: "howItWorks", href: "/how-it-works" },
      { key: "stories", href: "/transparency/stories" },
      { key: "reports", href: "/transparency/reports" },
    ],
  },
  {
    group: "about",
    links: [
      { key: "about", href: "/about" },
      { key: "documents", href: "/about#documents" },
      { key: "governance", href: "/about/governance" },
      { key: "shariahBoard", href: "/about/shariah-board" },
    ],
  },
];

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

/**
 * One desktop dropdown, built as a disclosure: hover or the button opens it,
 * ArrowDown moves into it, Escape closes it and returns focus, and it closes
 * once focus leaves. While closed the panel is `invisible`, so its links are
 * out of the tab order instead of being tabbed through unseen.
 */
function DropdownGroup({
  label,
  links,
  isOpen,
  setOpen,
  currentPath,
}: {
  label: string;
  links: { key: LinkKey; href: string }[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  currentPath: string;
}) {
  const { common, href } = useI18n();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <li
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        // Don't hide links from under a keyboard user who is inside the panel.
        if (!panelRef.current?.contains(document.activeElement)) setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`flex items-center gap-1 whitespace-nowrap rounded-sm text-sm transition-colors hover:text-navy ${FOCUS_RING} ${isOpen ? "text-navy" : "text-muted-ink"}`}
        onClick={() => setOpen(!isOpen)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            // Wait for the panel to become visible before moving focus into it.
            requestAnimationFrame(() => panelRef.current?.querySelector("a")?.focus());
          }
        }}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        {label}
        <ChevronDownIcon
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id={panelId}
        ref={panelRef}
        className={`absolute start-0 top-full min-w-[240px] pt-3 transition-all duration-200 ${isOpen ? "visible pointer-events-auto translate-y-0 opacity-100" : "invisible pointer-events-none -translate-y-1 opacity-0"}`}
      >
        <div className="overflow-hidden rounded-xl border border-black/5 bg-white py-2 shadow-lg shadow-black/5">
          {links.map((link) => (
            <Link
              key={link.key}
              href={href(link.href)}
              title={common.nav.links[link.key].title}
              onClick={() => setOpen(false)}
              aria-current={link.href === currentPath ? "page" : undefined}
              className="flex flex-col px-4 py-2.5 text-sm text-navy transition-colors hover:bg-black/[0.03] focus-visible:bg-black/[0.05] focus-visible:outline-none aria-[current=page]:font-medium"
            >
              {common.nav.links[link.key].label}
            </Link>
          ))}
        </div>
      </div>
    </li>
  );
}

export function Navbar() {
  const { common, href, dir } = useI18n();
  const nav = common.nav;
  // Compare without the language prefix: "/am/about" is the About page.
  const currentPath = splitLocale(usePathname() || "/").path;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, {
      passive: true,
    });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label={nav.ariaLabel}
      className={`fixed inset-x-0 top-0 z-30 transition-all duration-500 ease-out ${scrolled ? "px-3 pt-3" : "pt-0"}`}
    >
      {/* Below sm the bar drops the tagline and tightens its padding so the
          logo, Donate and the menu button fit on a 320px screen. */}
      <div
        className={`mx-auto flex items-center justify-between gap-3 transition-all duration-500 ease-out sm:gap-6 ${scrolled ? "max-w-6xl rounded-full border border-black/5 bg-white/80 px-4 py-2.5 shadow-lg shadow-black/5 backdrop-blur-xl sm:px-5" : "max-w-7xl bg-transparent px-4 py-5 sm:px-8 sm:py-6"}`}
      >
        {/* No aria-label: the visible "EZAC" text names the link, so speech
            users can say what they see. */}
        <Link
          href={href("/")}
          title={nav.home.title}
          className={`flex shrink-0 items-center gap-2 rounded-sm leading-none transition-all duration-500 ease-out sm:gap-3 ${FOCUS_RING}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- brand mark served as a static asset */}
          <img
            src="/logo.svg"
            alt={common.site.logoAlt}
            width={44}
            height={44}
            className={`w-auto transition-all duration-500 ease-out ${scrolled ? "h-8" : "h-9 sm:h-11"}`}
          />
          {scrolled ? (
            <span className="font-serif-display text-xl tracking-tight text-navy sm:text-2xl">
              {common.site.name}
            </span>
          ) : (
            <span className="flex min-w-0 max-w-[240px] flex-col">
              <span className="font-serif-display text-xl leading-[1.1] tracking-tight text-navy">
                {common.site.name}
              </span>
              <span className="hidden text-xs uppercase leading-snug tracking-[0.12em] text-muted-ink sm:block">
                {nav.home.tagline}
              </span>
            </span>
          )}
        </Link>

        <ul className="hidden items-center gap-6 xl:flex 2xl:gap-7">
          {MENU.map((item, idx) => (
            <DropdownGroup
              key={item.group}
              label={nav.groups[item.group]}
              links={item.links}
              currentPath={currentPath}
              isOpen={openIndex === idx}
              setOpen={(open) =>
                setOpenIndex((current) => (open ? idx : current === idx ? null : current))
              }
            />
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2 sm:gap-5">
          <LanguageSwitcher className="hidden md:flex" />

          {/* The staff portal is English only and not localized. */}
          <Link
            href="/login"
            title={nav.staffSignIn.title}
            className={`hidden rounded-sm text-sm text-muted-ink transition-colors hover:text-navy md:inline ${FOCUS_RING}`}
          >
            {nav.staffSignIn.label}
          </Link>

          <Link
            href={href("/donate")}
            title={nav.donate.title}
            className={`whitespace-nowrap rounded-full bg-brand px-3.5 py-2 text-xs text-white transition-transform duration-300 hover:scale-[1.03] sm:px-6 sm:py-2.5 sm:text-sm ${FOCUS_RING}`}
          >
            {nav.donate.label}
          </Link>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={nav.openMenu}
                title={nav.openMenu}
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/70 text-navy transition-colors hover:bg-white xl:hidden ${FOCUS_RING}`}
              >
                <MenuIcon aria-hidden="true" className="h-4 w-4" />
              </button>
            </SheetTrigger>
            {/* The panel slides in from the end side: right in English, left in Arabic. */}
            <SheetContent
              side={dir === "rtl" ? "left" : "right"}
              showCloseButton={false}
              className="gap-0 overflow-y-auto bg-white p-0"
            >
              <SheetHeader className="flex-row items-center justify-between gap-4 border-b border-black/5 px-6 py-5">
                <SheetTitle className="font-serif-display text-2xl text-navy">
                  {nav.menuTitle}
                </SheetTitle>
                <SheetDescription className="sr-only">{nav.menuDescription}</SheetDescription>
                <SheetClose asChild>
                  <button
                    type="button"
                    aria-label={nav.closeMenu}
                    title={nav.closeMenu}
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-navy transition-colors hover:bg-black/[0.03] ${FOCUS_RING}`}
                  >
                    <XIcon aria-hidden="true" className="h-4 w-4" />
                  </button>
                </SheetClose>
              </SheetHeader>

              <nav aria-label={nav.mobileAriaLabel} className="flex flex-col gap-6 px-6 py-5">
                {MENU.map((item) => (
                  <div key={item.group}>
                    <p className="text-xs uppercase tracking-[0.16em] text-brand">{nav.groups[item.group]}</p>
                    <ul className="mt-2">
                      {item.links.map((link) => (
                        <li key={link.key}>
                          {/* SheetClose closes the menu as the link navigates. */}
                          <SheetClose asChild>
                            <Link
                              href={href(link.href)}
                              title={nav.links[link.key].title}
                              aria-current={link.href === currentPath ? "page" : undefined}
                              className="-mx-2 block rounded-lg px-2 py-2.5 text-sm text-navy transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand aria-[current=page]:font-medium"
                            >
                              {nav.links[link.key].label}
                            </Link>
                          </SheetClose>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              <div className="border-t border-black/5 px-6 py-5">
                <LanguageList />
              </div>

              <SheetFooter className="gap-3 border-t border-black/5 px-6 py-5">
                <SheetClose asChild>
                  <Link
                    href={href("/donate")}
                    title={nav.donate.title}
                    className={`inline-flex w-full items-center justify-center rounded-full bg-brand py-3 text-sm text-white ${FOCUS_RING}`}
                  >
                    {nav.donate.label}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/login"
                    title={nav.staffSignIn.title}
                    className="inline-flex w-full items-center justify-center rounded-full border border-black/10 py-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {nav.staffSignIn.label}
                  </Link>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
