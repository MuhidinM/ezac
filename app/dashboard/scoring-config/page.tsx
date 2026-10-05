"use client";

import { useState } from "react";
import { Braces, Check, Copy, ListTree } from "lucide-react";

import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
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
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

type ScoringConfig = {
  id?: string;
  version: number;
  name?: string | null;
  active: boolean;
  config: Record<string, unknown>;
  createdAt?: string | null;
  activatedAt?: string | null;
};

function humanize(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (char) => char.toUpperCase());
}

function maxTotal(config: Record<string, unknown>) {
  const value = config.max_total ?? config.maxTotal;
  return typeof value === "number" ? value : null;
}

export default function ScoringConfigPage() {
  return (
    <RequireRole audience={["admin"]}>
      <ScoringConfigView />
    </RequireRole>
  );
}

function ScoringConfigView() {
  const active = useResource<ScoringConfig>("/api/backoffice/admin/scoring-configs/active");
  const versions = useResource<ScoringConfig[] | PaginatedItems<ScoringConfig>>(
    "/api/backoffice/admin/scoring-configs",
  );
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const list = Array.isArray(versions.data) ? versions.data : (versions.data?.items ?? []);
  const sorted = [...list].sort((a, b) => b.version - a.version);
  const selected =
    (selectedVersion !== null ? sorted.find((item) => item.version === selectedVersion) : null) ??
    active.data ??
    null;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Scoring configuration"
        description="Weights and thresholds used to score assessments. Read-only; new versions are published by the system team."
      />

      {active.error ? <InlineAlert>{active.error.message}</InlineAlert> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Active version" className="lg:col-span-2">
          {active.isLoading && !active.data ? (
            <div className="h-24 animate-pulse rounded-lg bg-black/[0.04]" />
          ) : active.data ? (
            <DetailList
              columns={4}
              items={[
                { label: "Version", value: `v${active.data.version}` },
                { label: "Name", value: active.data.name },
                { label: "Maximum score", value: maxTotal(active.data.config) },
                {
                  label: "Activated",
                  value: formatDateTime(active.data.activatedAt ?? active.data.createdAt ?? null),
                },
              ]}
            />
          ) : (
            <p className="text-sm text-black/50">No active configuration.</p>
          )}
        </Panel>

        <Panel title="Risk bands" description="How a total score maps to risk and the system recommendation.">
          <ul className="space-y-2.5 text-sm">
            <RiskBand tone="bg-rose-500" label="High" range="180 and above" recommendation="Approve" />
            <RiskBand tone="bg-amber-500" label="Medium" range="110 – 179" recommendation="Conditional approval" />
            <RiskBand tone="bg-emerald-500" label="Low" range="Below 110" recommendation="Defer" />
          </ul>
          <p className="mt-3 text-xs text-black/45">Bands as documented for v1; see the config for exact thresholds.</p>
        </Panel>
      </div>

      <Panel title="Versions" flush>
        {versions.error ? (
          <div className="px-5 pt-4">
            <InlineAlert>{versions.error.message}</InlineAlert>
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">Version</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Maximum</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="pr-5">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.isLoading && sorted.length === 0 ? (
              <TableSkeletonRows colSpan={5} rows={2} />
            ) : sorted.length === 0 ? (
              <TableMessageRow colSpan={5}>No versions found.</TableMessageRow>
            ) : (
              sorted.map((item) => {
                const isSelected = selected?.version === item.version;
                return (
                  <TableRow
                    key={item.version}
                    className={cn("cursor-pointer", isSelected && "bg-[#007050]/[0.04]")}
                    onClick={() => setSelectedVersion(item.version)}
                    aria-selected={isSelected}
                  >
                    <TableCell className="pl-5 font-semibold text-[#001539] tabular-nums">v{item.version}</TableCell>
                    <TableCell>{item.name ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{maxTotal(item.config) ?? "—"}</TableCell>
                    <TableCell>{formatDateTime(item.createdAt ?? null)}</TableCell>
                    <TableCell className="pr-5">
                      <Badge tone={item.active ? "success" : "neutral"}>{item.active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Panel>

      {selected ? <ConfigViewer config={selected} /> : null}
    </section>
  );
}

function RiskBand({
  tone,
  label,
  range,
  recommendation,
}: {
  tone: string;
  label: string;
  range: string;
  recommendation: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className={cn("h-8 w-1.5 rounded-full", tone)} />
      <span className="flex-1">
        <span className="block font-medium text-[#001539]">{label}</span>
        <span className="block text-xs text-black/50">{range}</span>
      </span>
      <span className="text-xs text-black/60">{recommendation}</span>
    </li>
  );
}

function ConfigViewer({ config }: { config: ScoringConfig }) {
  const [mode, setMode] = useState<"tree" | "json">("tree");
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(config.config, null, 2);

  return (
    <Panel
      title={`Configuration v${config.version}`}
      description={config.name ?? undefined}
      actions={
        <>
          <div className="inline-flex rounded-lg border border-black/10 bg-white p-0.5">
            <ModeButton active={mode === "tree"} onClick={() => setMode("tree")} icon={ListTree} label="Readable" />
            <ModeButton active={mode === "json"} onClick={() => setMode("json")} icon={Braces} label="JSON" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setCopied(await copyToClipboard(json));
            }}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </>
      }
    >
      {mode === "json" ? (
        <pre className="max-h-[32rem] overflow-auto rounded-lg bg-[#001539] p-4 font-mono text-xs leading-relaxed text-white/90">
          {json}
        </pre>
      ) : (
        <ConfigTree value={config.config} />
      )}
    </Panel>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof ListTree;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition",
        active ? "bg-[#001539] text-white" : "text-black/60 hover:text-[#001539]",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function Primitive({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-black/40">—</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "number") return <span className="font-medium text-[#001539] tabular-nums">{value}</span>;
  return <span className="text-[#001539]">{String(value)}</span>;
}

/** Nested config rendered as labelled groups; arrays of primitives inline. */
function ConfigTree({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item !== "object" || item === null)) {
      return (
        <span className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} tone="neutral">
              {String(item)}
            </Badge>
          ))}
        </span>
      );
    }
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="rounded-lg border border-black/[0.06] p-3">
            <ConfigTree value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <dl className={cn("divide-y divide-black/[0.05]", depth > 0 && "pl-4")}>
        {entries.map(([key, child]) => {
          const nested = child !== null && typeof child === "object";
          return (
            <div key={key} className={cn("py-2", nested ? "space-y-1.5" : "flex items-baseline justify-between gap-4")}>
              <dt className={cn("text-sm", nested ? "font-semibold text-[#001539]" : "text-black/60")}>
                {humanize(key)}
              </dt>
              <dd className={cn("text-sm", nested ? undefined : "text-right")}>
                {nested ? <ConfigTree value={child} depth={depth + 1} /> : <Primitive value={child} />}
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }

  return <Primitive value={value} />;
}
