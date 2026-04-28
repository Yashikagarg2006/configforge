"use client";

import { SafeConfig, ConfigWarning } from "@/types/config";

interface Props {
  component: { type: string } & Record<string, unknown>;
  config: SafeConfig;
  warnings: ConfigWarning[];
}

export default function UnsupportedComponent({ component }: Props) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-4 flex items-start gap-3">
      <span className="text-amber-400 text-xl mt-0.5">⚠</span>
      <div>
        <p className="text-amber-300 font-medium">Unsupported component: <code className="bg-amber-500/20 px-1.5 py-0.5 rounded text-sm">{component.type}</code></p>
        <p className="text-amber-400/60 text-sm mt-1">This component type is not registered. Add it to the component registry to enable it.</p>
      </div>
    </div>
  );
}
