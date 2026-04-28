"use client";

import { ChartComponent, SafeConfig, ConfigWarning } from "@/types/config";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  component: ChartComponent & Record<string, unknown>;
  config: SafeConfig;
  warnings: ConfigWarning[];
}

const PLACEHOLDER_DATA = [
  { name: "Jan", value: 40 }, { name: "Feb", value: 65 }, { name: "Mar", value: 52 },
  { name: "Apr", value: 78 }, { name: "May", value: 61 }, { name: "Jun", value: 90 },
];

export default function ChartPlaceholder({ component }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/60">Chart — {component.table ?? "data"}</h3>
        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">Preview</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={PLACEHOLDER_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
          <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
          <Bar dataKey="value" fill="url(#chartGrad)" radius={[4, 4, 0, 0]} />
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-white/30 text-center mt-2">Sample data — connect real data source via config</p>
    </div>
  );
}
