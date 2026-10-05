"use client";

import { useEffect } from "react";
import Link from "next/link";

import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
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
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader title="Registration couldn't load" />
      <InlineAlert
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reset}>
              Try again
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/register">Start over</Link>
            </Button>
          </div>
        }
      >
        {error.message || "Something went wrong in the registration flow."}
      </InlineAlert>
    </section>
  );
}
