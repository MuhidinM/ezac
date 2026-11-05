import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page is a client component, so the browser tab title is set here.
export const metadata: Metadata = { title: "Field officers" };

export default function FieldOfficersLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
