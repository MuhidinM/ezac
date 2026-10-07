"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { StoryStatusBadge } from "@/components/zakat/story-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useResource } from "@/lib/api/use-resource";
import { formatDate } from "@/lib/backoffice/format";
import { type AdminStory, categoryLabel, mediaSrc } from "@/lib/zakat/content";

export default function StoriesAdminPage() {
  return (
    <RequireRole audience={["admin"]}>
      <StoriesAdmin />
    </RequireRole>
  );
}

function StoriesAdmin() {
  // Plain array of all states, newest first.
  const { data, error, isLoading } = useResource<AdminStory[]>("/api/zakat-admin/impact/stories");
  const stories = data ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Impact stories"
        description="Stories shown on the app's Impact screen and the public site. Publish only with the beneficiary's consent."
        actions={
          <Button asChild>
            <Link href="/dashboard/zakat/stories/new">
              <Plus />
              New story
            </Link>
          </Button>
        }
      />

      <Panel flush>
        {error ? (
          <div className="px-5 pt-4">
            <InlineAlert>{error.message}</InlineAlert>
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">Story</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5">Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && stories.length === 0 ? (
              <TableSkeletonRows colSpan={5} />
            ) : stories.length === 0 ? (
              <TableMessageRow colSpan={5}>No stories yet.</TableMessageRow>
            ) : (
              stories.map((story) => (
                <TableRow key={story.id} className="relative">
                  <TableCell className="pl-5">
                    <span className="flex items-center gap-3">
                      {story.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- served by the zakat service
                        <img src={mediaSrc(story.imageUrl) ?? undefined} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                      ) : (
                        <span className="size-10 shrink-0 rounded-md bg-black/[0.05]" />
                      )}
                      <span className="min-w-0">
                        <Link
                          href={`/dashboard/zakat/stories/${encodeURIComponent(story.id)}`}
                          className="block truncate font-medium text-[#001539] after:absolute after:inset-0 hover:underline"
                        >
                          {story.title}
                        </Link>
                        <span className="block max-w-sm truncate text-xs text-black/50">{story.summary}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>{categoryLabel(story.category)}</TableCell>
                  <TableCell>{story.region ?? "—"}</TableCell>
                  <TableCell>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <StoryStatusBadge status={story.status} />
                      {!story.consentConfirmed ? <Badge tone="danger">No consent</Badge> : null}
                    </span>
                  </TableCell>
                  <TableCell className="pr-5 text-sm text-black/60">{formatDate(story.publishedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Panel>
    </section>
  );
}
