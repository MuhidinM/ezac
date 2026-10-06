"use client";

import { type ReactNode, useState } from "react";
import { Braces, Check, Copy, ListTree } from "lucide-react";

import { Panel } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import type { ScoringConfigVersion } from "@/lib/backoffice/scoring-config";
import { cn } from "@/lib/utils";

type ScoringConfig = Pick<ScoringConfigVersion, "version" | "name" | "config">;

function humanize(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function ConfigViewer({ config, actions }: { config: ScoringConfig; actions?: ReactNode }) {
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
