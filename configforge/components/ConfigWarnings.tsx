"use client";

import { ConfigWarning } from "@/types/config";

interface Props {
  warnings: ConfigWarning[];
  title?: string;
  collapsible?: boolean;
}

const SEVERITY_STYLES = {
  warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  error:   "bg-rose-500/10 border-rose-500/30 text-rose-300",
  info:    "bg-blue-500/10 border-blue-500/30 text-blue-300",
};

const SEVERITY_ICONS = { warning: "⚠", error: "✖", info: "ℹ" };

export default function ConfigWarnings({ warnings, title = "Config Warnings", collapsible = true }: Props) {
  if (!warnings || warnings.length === 0) return null;

  const hasErrors   = warnings.some((w) => w.severity === "error");
  const hasWarnings = warnings.some((w) => w.severity === "warning");

  const headerStyle = hasErrors
    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
    : hasWarnings
    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
    : "bg-blue-500/10 border-blue-500/30 text-blue-300";

  return (
    <details open={!collapsible} className={`border rounded-xl mb-4 overflow-hidden ${headerStyle}`}>
      <summary className={`px-4 py-3 cursor-pointer font-medium text-sm flex items-center gap-2 ${collapsible ? "hover:opacity-80" : "cursor-default"}`}>
        <span>{hasErrors ? "✖" : "⚠"}</span>
        {title} ({warnings.length})
      </summary>
      <div className="px-4 pb-3 space-y-1.5">
        {warnings.map((w, i) => (
          <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded-lg border ${SEVERITY_STYLES[w.severity]}`}>
            <span className="mt-0.5 shrink-0">{SEVERITY_ICONS[w.severity]}</span>
            <div>
              <span className="font-mono opacity-60 mr-1">[{w.field}]</span>
              {w.message}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
