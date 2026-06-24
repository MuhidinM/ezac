import Link from "next/link";

const MENU_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/beneficiary", label: "Beneficiary" },
  { href: "/dashboard/register", label: "Register beneficiary" },
  { href: "/dashboard/donations", label: "Donations" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/profile", label: "Profile" },
];

export function DashboardSidebar() {
  return (
    <aside className="sticky top-0 hidden h-full w-64 shrink-0 overflow-y-auto border-r border-black/5 bg-white/90 p-4 backdrop-blur-xl md:block">
      <p className="px-3 text-xs uppercase tracking-[0.16em] text-black/45">Dashboard</p>
      <nav className="mt-3 space-y-1.5">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl px-3 py-2 text-sm text-black/70 transition hover:bg-black/3 hover:text-black"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
