"use client";

import { type ReactNode, useState } from "react";
import { Braces, Check, Copy, ListTree } from "lucide-react";

import { ScoringDesigner } from "@/components/scoring/scoring-designer";

import { Panel } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl, type ChoiceOption } from "@/components/ui/segmented-control";
import { copyToClipboard } from "@/lib/clipboard";
import type { ScoringConfigVersion, ScoringSchema } from "@/lib/backoffice/scoring-config";
import { cn } from "@/lib/utils";

const MODE_OPTIONS: readonly ChoiceOption<"tree" | "json">[] = [
  {
    value: "tree",
    label: (
      <span className="inline-flex items-center gap-1.5">
        <ListTree className="size-3.5" aria-hidden />
        Readable
      </span>
    ),
  },
  {
    value: "json",
    label: (
      <span className="inline-flex items-center gap-1.5">
        <Braces className="size-3.5" aria-hidden />
        Technical
      </span>
    ),
  },
];

type ScoringConfig = Pick<ScoringConfigVersion, "version" | "name" | "config">;

function humanize(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function ConfigViewer({
  config,
  schema,
  baseConfig,
  actions,
}: {
  config: ScoringConfig;
  /** With a schema the version is shown in the plain-language layout. */
  schema?: ScoringSchema | null;
  baseConfig?: Record<string, unknown> | null;
  actions?: ReactNode;
}) {
  const [mode, setMode] = useState<"tree" | "json">("tree");
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(config.config, null, 2);

  return (
    <Panel
      title={`Configuration v${config.version}`}
      description={config.name ?? undefined}
      actions={
        <>
          {actions}
          <SegmentedControl
            size="sm"
            aria-label="View"
            value={mode}
            onValueChange={setMode}
            options={MODE_OPTIONS}
          />
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
        <pre className="max-h-[32rem] overflow-auto rounded-lg bg-navy p-4 font-mono text-xs leading-relaxed text-white/90">
          {json}
        </pre>
      ) : schema ? (
        <ScoringDesigner schema={schema} config={config.config} baseConfig={baseConfig} />
      ) : (
        <ConfigTree value={config.config} />
      )}
    </Panel>
  );
}

function Primitive({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-black/60">—</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "number") return <span className="font-medium text-navy tabular-nums">{value}</span>;
  return <span className="text-navy">{String(value)}</span>;
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
              <dt className={cn("text-sm", nested ? "font-semibold text-navy" : "text-black/60")}>
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
