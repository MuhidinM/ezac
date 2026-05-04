"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon, GlobeIcon } from "lucide-react";

type MenuItem = {
  label: string;
  children?: {
    label: string;
    note?: string;
  }[];
};

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Zakat",
    children: [
      { label: "Zakat Calculator" },
      { label: "Pay Zakat Now" },
      { label: "Corporate Zakat" },
    ],
  },
  {
    label: "Waqf",
    children: [
      { label: "Crowdfunding Projects" },
      { label: "Waqf Investments" },
      { label: "Register a Waqf Asset" },
    ],
  },
  {
    label: "Transparency & Impact",
    children: [
      { label: "Live Dashboard", note: "Crucial for Phase 1" },
      { label: "Impact Reports" },
    ],
  },
  {
    label: "About Us",
    children: [
      { label: "Governance & Majlis" },
      { label: "Shari'ah Advisory Board" },
    ],
  },
];

const LANGUAGES = ["EN", "AM", "OR", "AR"];

export function Navbar() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState("EN");
  const [langOpen, setLangOpen] = useState(false);
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
      className="fixed inset-x-0 top-0 z-30 transition-all duration-500 ease-out"
      style={{
        paddingTop: scrolled ? "12px" : "0px",
      }}
    >
      <div
        className={`mx-auto flex items-center justify-between gap-6 transition-all duration-500 ease-out ${scrolled ? "max-w-5xl rounded-full border border-black/5 bg-white/80 px-5 py-2.5 shadow-lg shadow-black/5 backdrop-blur-xl" : "max-w-7xl bg-transparent px-8 py-6"}`}
      >
        <a href="#" className="flex shrink-0 flex-col leading-none">
          <span
            className={`font-serif-display tracking-tight transition-all duration-500 ${scrolled ? "text-2xl" : "text-3xl"}`}
            style={{ color: "#000000" }}
          >
            EZAC
          </span>
          <span
            className="mt-1 overflow-hidden text-[10px] uppercase tracking-[0.18em] transition-all duration-500"
            style={{
              color: "#6F6F6F",
              maxHeight: scrolled ? "0px" : "20px",
              opacity: scrolled ? 0 : 1,
              marginTop: scrolled ? "0px" : "4px",
            }}
          >
            Ethiopian Zakat &amp; Awqaf Commission
          </span>
        </a>

        <ul className="hidden items-center gap-7 lg:flex">
          {MENU_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <li
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenIndex(idx)}
                onMouseLeave={() => setOpenIndex(null)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm transition-colors hover:text-black"
                  style={{
                    color: isOpen ? "#000000" : "#6F6F6F",
                  }}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                >
                  {item.label}
                  <ChevronDownIcon
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {item.children && (
                  <div
                    className={`absolute left-0 top-full min-w-[240px] pt-3 transition-all duration-200 ${isOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"}`}
                  >
                    <div className="overflow-hidden rounded-xl border border-black/5 bg-white py-2 shadow-lg shadow-black/5">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href="#"
                          className="flex flex-col px-4 py-2.5 text-sm transition-colors hover:bg-black/[0.03]"
                          style={{ color: "#000000" }}
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
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex shrink-0 items-center gap-5">
          <div
            className="relative hidden md:block"
            onMouseEnter={() => setLangOpen(true)}
            onMouseLeave={() => setLangOpen(false)}
          >
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-black"
              style={{ color: "#6F6F6F" }}
              aria-haspopup="true"
              aria-expanded={langOpen}
            >
              <GlobeIcon className="h-3.5 w-3.5" />
              <span style={{ color: "#000000", fontWeight: 500 }}>
                {activeLang}
              </span>
              <ChevronDownIcon
                className={`h-3 w-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className={`absolute right-0 top-full min-w-[140px] pt-3 transition-all duration-200 ${langOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"}`}
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
                      color: activeLang === lang ? "#000000" : "#6F6F6F",
                      fontWeight: activeLang === lang ? 500 : 400,
                    }}
                  >
                    <span>{lang}</span>
                    {activeLang === lang && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: "#000000" }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <a
            href="#"
            className="hidden text-sm transition-colors hover:text-black md:inline"
            style={{ color: "#6F6F6F" }}
          >
            Log In / Register
          </a>

          <button
            className="rounded-full px-6 py-2.5 text-sm transition-transform duration-300 hover:scale-[1.03]"
            style={{
              backgroundColor: "#000000",
              color: "#FFFFFF",
            }}
          >
            Donate Now
          </button>
        </div>
      </div>
    </nav>
  );
}
