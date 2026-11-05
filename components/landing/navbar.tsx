"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, GlobeIcon, MenuIcon } from "lucide-react";

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

type MenuItem = {
  label: string;
  children: {
    label: string;
    href: string;
    note?: string;
  }[];
};

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Zakat",
    children: [
      { label: "Zakat Calculator", href: "/zakat/calculator" },
      { label: "Pay Zakat Now", href: "/zakat/pay" },
      { label: "Causes", href: "/causes" },
      { label: "Corporate Zakat", href: "/zakat/corporate" },
    ],
  },
  {
    label: "Waqf",
    children: [
      { label: "Waqf Crowdfunding", href: "/waqf/crowdfunding" },
      { label: "Waqf Investments", href: "/waqf/investments" },
      { label: "Register a Waqf Asset", href: "/waqf/register-asset" },
    ],
  },
  {
    label: "Transparency & Impact",
    children: [
      {
        label: "Live Dashboard",
        href: "/transparency/dashboard",
      },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Impact Stories", href: "/transparency/stories" },
      { label: "Impact Reports", href: "/transparency/reports" },
    ],
  },
  {
    label: "About Us",
    children: [
      { label: "About the Commission", href: "/about" },
      { label: "Legal Documents", href: "/about#documents" },
      { label: "Governance & Majlis", href: "/about/governance" },
      { label: "Shari'ah Advisory Board", href: "/about/shariah-board" },
    ],
  },
];

const LANGUAGES = ["EN", "AM", "OR", "AR"];

/**
 * One desktop dropdown, built as a disclosure: hover or the button opens it,
 * ArrowDown moves into it, Escape closes it and returns focus, and it closes
 * once focus leaves. While closed the panel is `invisible`, so its links are
 * out of the tab order instead of being tabbed through unseen.
 */
function DropdownGroup({
  item,
  isOpen,
  setOpen,
  pathname,
}: {
  item: MenuItem;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  pathname: string;
}) {
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
        className="flex items-center gap-1 rounded-sm text-sm transition-colors hover:text-[#001539] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2"
        style={{
          color: isOpen ? "#001539" : "#6F6F6F",
        }}
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
        {item.label}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id={panelId}
        ref={panelRef}
        className={`absolute left-0 top-full min-w-[240px] pt-3 transition-all duration-200 ${isOpen ? "visible pointer-events-auto translate-y-0 opacity-100" : "invisible pointer-events-none -translate-y-1 opacity-0"}`}
      >
        <div className="overflow-hidden rounded-xl border border-black/5 bg-white py-2 shadow-lg shadow-black/5">
          {item.children.map((child) => (
            <Link
              key={child.label}
              href={child.href}
              onClick={() => setOpen(false)}
              aria-current={child.href === pathname ? "page" : undefined}
              className="flex flex-col px-4 py-2.5 text-sm transition-colors hover:bg-black/[0.03] focus-visible:bg-black/[0.05] focus-visible:outline-none"
              style={{ color: "#001539" }}
            >
              <span>{child.label}</span>
              {child.note && (
                <span
                  className="mt-0.5 text-xs"
                  style={{ color: "#6F6F6F" }}
                >
                  {child.note}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </li>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState("EN");
  const [langOpen, setLangOpen] = useState(false);
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
      aria-label="Main"
      className={`fixed inset-x-0 top-0 z-30 transition-all duration-500 ease-out ${scrolled ? "px-3" : ""}`}
      style={{
        paddingTop: scrolled ? "12px" : "0px",
      }}
    >
      {/* Below sm the bar drops the tagline and tightens its padding so the
          logo, Donate and the menu button fit on a 320px screen. */}
      <div
        className={`mx-auto flex items-center justify-between gap-3 transition-all duration-500 ease-out sm:gap-6 ${scrolled ? "max-w-5xl rounded-full border border-black/5 bg-white/80 px-4 py-2.5 shadow-lg shadow-black/5 backdrop-blur-xl sm:px-5" : "max-w-7xl bg-transparent px-4 py-5 sm:px-8 sm:py-6"}`}
      >
        <Link
          href="/"
          aria-label="EZAC home"
          className="flex shrink-0 items-center gap-2 rounded-sm leading-none transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2 sm:gap-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- brand mark served as a static asset */}
          <img
            src="/logo.svg"
            alt=""
            className={`w-auto transition-all duration-500 ease-out ${scrolled ? "h-8" : "h-9 sm:h-11"}`}
          />
          {scrolled ? (
            <span
              className="font-serif-display text-xl tracking-tight sm:text-2xl"
              style={{ color: "#001539" }}
            >
              EZAC
            </span>
          ) : (
            <span className="flex min-w-0 max-w-[220px] flex-col">
              <span
                className="font-serif-display text-xl tracking-tight"
                style={{ color: "#001539", lineHeight: 1.1 }}
              >
                EZAC
              </span>
              <span
                className="hidden text-[10px] uppercase tracking-[0.18em] sm:block"
                style={{
                  color: "#6F6F6F",
                  lineHeight: 1.4,
                }}
              >
                Ethiopian Zakat &amp; Awqaf Commission
              </span>
            </span>
          )}
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {MENU_ITEMS.map((item, idx) => (
            <DropdownGroup
              key={item.label}
              item={item}
              pathname={pathname}
              isOpen={openIndex === idx}
              setOpen={(open) =>
                setOpenIndex((current) => (open ? idx : current === idx ? null : current))
              }
            />
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2 sm:gap-5">
          <div
            className="relative hidden md:block"
            onMouseEnter={() => setLangOpen(true)}
            onMouseLeave={() => setLangOpen(false)}
          >
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#001539]"
              style={{ color: "#6F6F6F" }}
              aria-haspopup="true"
              aria-expanded={langOpen}
            >
              <GlobeIcon className="h-3.5 w-3.5" />
              <span style={{ color: "#001539", fontWeight: 500 }}>
                {activeLang}
              </span>
              <ChevronDownIcon
                className={`h-3 w-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* `invisible` keeps the closed list out of the tab order. */}
            <div
              className={`absolute right-0 top-full min-w-[140px] pt-3 transition-all duration-200 ${langOpen ? "visible pointer-events-auto translate-y-0 opacity-100" : "invisible pointer-events-none -translate-y-1 opacity-0"}`}
            >
              <div className="overflow-hidden rounded-xl border border-black/5 bg-white py-1.5 shadow-lg shadow-black/5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setActiveLang(lang);
                      setLangOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors hover:bg-black/[0.03]"
                    style={{
                      color: activeLang === lang ? "#001539" : "#6F6F6F",
                      fontWeight: activeLang === lang ? 500 : 400,
                    }}
                  >
                    <span>{lang}</span>
                    {activeLang === lang && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: "#007050" }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/login"
            className="hidden text-sm transition-colors hover:text-[#001539] md:inline"
            style={{ color: "#6F6F6F" }}
          >
            Staff sign-in
          </Link>

          <Link
            href="/donate"
            className="whitespace-nowrap rounded-full px-3.5 py-2 text-xs transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2 sm:px-6 sm:py-2.5 sm:text-sm"
            style={{
              backgroundColor: "#007050",
              color: "#FFFFFF",
            }}
          >
            Donate Now
          </Link>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/70 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2 lg:hidden"
                style={{ color: "#001539" }}
              >
                <MenuIcon className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="gap-0 overflow-y-auto bg-white p-0"
            >
              <SheetHeader className="border-b border-black/5 px-6 py-5">
                <SheetTitle className="font-serif-display text-2xl" style={{ color: "#001539" }}>
                  Menu
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Pages on the EZAC website
                </SheetDescription>
              </SheetHeader>

              <nav aria-label="Main menu" className="flex flex-col gap-6 px-6 py-5">
                {MENU_ITEMS.map((item) => (
                  <div key={item.label}>
                    <p
                      className="text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: "#007050" }}
                    >
                      {item.label}
                    </p>
                    <ul className="mt-2">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          {/* SheetClose closes the menu as the link navigates. */}
                          <SheetClose asChild>
                            <Link
                              href={child.href}
                              aria-current={child.href === pathname ? "page" : undefined}
                              className="-mx-2 block rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050]"
                              style={{ color: "#001539" }}
                            >
                              {child.label}
                            </Link>
                          </SheetClose>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              <SheetFooter className="gap-3 border-t border-black/5 px-6 py-5">
                <SheetClose asChild>
                  <Link
                    href="/donate"
                    className="inline-flex w-full items-center justify-center rounded-full py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050] focus-visible:ring-offset-2"
                    style={{ backgroundColor: "#007050", color: "#FFFFFF" }}
                  >
                    Donate Now
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/login"
                    className="inline-flex w-full items-center justify-center rounded-full border border-black/10 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007050]"
                    style={{ color: "#001539" }}
                  >
                    Staff sign-in
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
