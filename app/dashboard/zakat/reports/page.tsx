"use client";

import { type FormEvent, useRef, useState } from "react";
import { Archive, FileText, Plus, Send } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatBytes } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";

const API = "/api/zakat-admin/impact/reports";
const MAX_BYTES = 20 * 1024 * 1024;

type AdminReport = {
  id: string;
  title: string;
  period: string | null;
  summary: string | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;
  publishedAt: string | null;
  fileUrl: string | null;
  sizeBytes: number | null;
  createdAt?: string | null;
};

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Draft", tone: "warning" },
  PUBLISHED: { label: "Published", tone: "success" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export default function ImpactReportsAdminPage() {
  return (
    <RequireRole audience={["admin"]}>
      <ImpactReportsAdmin />
    </RequireRole>
  );
}

function ImpactReportsAdmin() {
  const { data, error, isLoading, reload } = useResource<PaginatedItems<AdminReport> | AdminReport[]>(`${API}?page=1&limit=100`);
  const reports = Array.isArray(data) ? data : (data?.items ?? []);
  const [createOpen, setCreateOpen] = useState(false);
  const [action, setAction] = useState<{ report: AdminReport; kind: "publish" | "archive" } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Impact reports"
        description="PDF reports listed on the public Transparency › Reports page. New reports start as drafts and appear publicly once published."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            New report
          </Button>
        }
      />

      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}

      <Panel flush>
        {error ? (
          <div className="px-5 pt-4">
            <InlineAlert>{error.message}</InlineAlert>
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">Report</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && reports.length === 0 ? (
              <TableSkeletonRows colSpan={5} />
            ) : reports.length === 0 ? (
              <TableMessageRow colSpan={5}>No reports yet. Upload a PDF to create the first one.</TableMessageRow>
            ) : (
              reports.map((report) => {
                const status = STATUS[report.status ?? ""] ?? { label: report.status ?? "—", tone: "neutral" as const };
                return (
                  <TableRow key={report.id}>
                    <TableCell className="pl-5">
                      <span className="flex items-start gap-3">
                        <FileText className="mt-0.5 size-4 shrink-0 text-black/40" />
                        <span className="min-w-0">
                          {report.fileUrl ? (
                            <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[#001539] hover:underline">
                              {report.title}
                            </a>
                          ) : (
                            <span className="font-medium text-[#001539]">{report.title}</span>
                          )}
                          <span className="block max-w-md truncate text-xs text-black/50">
                            {[report.summary, formatBytes(report.sizeBytes)].filter(Boolean).join(" · ") || "—"}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>{report.period ?? "—"}</TableCell>
                    <TableCell>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(report.publishedAt)}</TableCell>
                    <TableCell className="pr-5 text-right">
                      {report.status === "DRAFT" ? (
                        <Button size="sm" variant="outline" onClick={() => setAction({ report, kind: "publish" })}>
                          <Send />
                          Publish
                        </Button>
                      ) : report.status === "PUBLISHED" ? (
                        <Button size="sm" variant="ghost" onClick={() => setAction({ report, kind: "archive" })}>
                          <Archive />
                          Archive
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Panel>

      <CreateReportDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setNotice("Draft created. Publish it when it's ready to go public.");
          reload();
        }}
      />

      <ConfirmDialog
        open={action !== null}
        onOpenChange={(open) => (open ? null : setAction(null))}
        title={action?.kind === "publish" ? "Publish this report?" : "Archive this report?"}
        description={
          action?.kind === "publish"
            ? `"${action.report.title}" will appear on the public reports page.`
            : `"${action?.report.title}" will be removed from the public reports page.`
        }
        confirmLabel={action?.kind === "publish" ? "Publish" : "Archive"}
        destructive={action?.kind === "archive"}
        onConfirm={async () => {
          if (!action) return;
          await apiClient(`${API}/${encodeURIComponent(action.report.id)}/${action.kind}`, { method: "POST" });
          setNotice(action.kind === "publish" ? "Report published." : "Report archived.");
          reload();
        }}
      />
    </section>
  );
}

function CreateReportDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState("");
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose the PDF file.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Reports must be PDF files.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("The PDF must be 20 MB or smaller.");
      return;
    }
    setIsSaving(true);
    try {
      // 1. Upload the PDF, 2. create the report as a draft pointing at it.
      const body = new FormData();
      body.append("file", file);
      const media = await apiClient<{ id: string; url: string }>("/api/zakat-admin/media/documents", {
        method: "POST",
        body,
      });
      await apiClient(API, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          period: period.trim(),
          summary: summary.trim() || undefined,
          fileMediaId: media.id,
        }),
      });
      setTitle("");
      setPeriod("");
      setSummary("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onOpenChange(false);
      onCreated();
    } catch (createError) {
      setError(errorMessage(createError, "Couldn't create the report"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">New impact report</DialogTitle>
            <DialogDescription>Upload the PDF; the report is saved as a draft until you publish it.</DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          <FormField label="Title" htmlFor="report-title" required>
            <Input id="report-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Annual report 1447" required />
          </FormField>
          <FormField label="Period" htmlFor="report-period" required>
            <Input id="report-period" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="1447 AH, Q1 2026…" required />
          </FormField>
          <FormField label="Summary" htmlFor="report-summary" hint="Optional, shown under the title">
            <Textarea id="report-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </FormField>
          <FormField label="PDF file" htmlFor="report-file" required hint="PDF only, up to 20 MB">
            <input
              ref={fileRef}
              id="report-file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-black/60 file:mr-3 file:rounded-md file:border-0 file:bg-[#001539] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Uploading…" : "Create draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
