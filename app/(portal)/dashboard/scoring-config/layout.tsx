import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page is a client component, so the browser tab title is set here.
export const metadata: Metadata = { title: "Scoring" };

export default function ScoringLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
