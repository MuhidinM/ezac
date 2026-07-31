"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[register]", error);
  }, [error]);

  return (
    <section className="mx-auto w-full max-w-xl space-y-4 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
      <h1 className="font-serif-display text-2xl tracking-tight text-[#001539]">
        Registration couldn&apos;t load
      </h1>
      <p className="text-sm text-black/65">
        {error.message || "Something went wrong in the registration flow."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={reset}>
          Try again
        </Button>
        <Button type="button" asChild>
          <a href="/dashboard/register">Back to branch selection</a>
        </Button>
      </div>
    </section>
  );
}
