"use client";

import Link from "next/link";

import { ErrorReference } from "@/components/errors/error-reference";
import { useLoggedError } from "@/components/errors/use-logged-error";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

export default function RegisterError({ error, retry }: { error: unknown; retry: () => void }) {
  // Never show error.message: errors thrown in the browser keep their raw,
  // technical text. The reference matches the server log instead.
  const reference = useLoggedError("register", error);

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader title="Registration couldn't load" />
      <InlineAlert
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => retry()}>
              Try again
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/register">Start over</Link>
            </Button>
          </div>
        }
      >
        <p>Something went wrong on our side. Try again, or start the registration over.</p>
        <ErrorReference digest={reference} className="mt-1" />
      </InlineAlert>
    </section>
  );
}
