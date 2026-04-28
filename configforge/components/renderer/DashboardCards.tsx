"use client";

import { useState, useEffect } from "react";
import { DashboardComponent, SafeConfig, ConfigWarning } from "@/types/config";

interface Props {
  component: DashboardComponent & Record<string, unknown>;
  config: SafeConfig;
  warnings: ConfigWarning[];
}

interface CardData { table: string; count: number; loading: boolean; }

const CARD_COLORS = [
  "from-violet-600/30 to-violet-800/20 border-violet-500/30",
  "from-cyan-600/30 to-cyan-800/20 border-cyan-500/30",
  "from-emerald-600/30 to-emerald-800/20 border-emerald-500/30",
  "from-amber-600/30 to-amber-800/20 border-amber-500/30",
  "from-pink-600/30 to-pink-800/20 border-pink-500/30",
  "from-indigo-600/30 to-indigo-800/20 border-indigo-500/30",
];

const ICONS: Record<string, string> = { students: "🎓", tasks: "✅", products: "📦", leads: "🎯", orders: "🛒", employees: "👥" };

export default function DashboardCards({ component, config }: Props) {
  const tables = component.tables ?? Object.keys(config.database.tables);
  const [cards, setCards] = useState<CardData[]>(tables.map((t) => ({ table: t, count: 0, loading: true })));

  useEffect(() => {
    tables.forEach(async (tableName, idx) => {
      try {
        const res = await fetch(`/api/dynamic/${tableName}?limit=1`);
        if (res.ok) {
          const json = await res.json();
          setCards((prev) => prev.map((c, i) => i === idx ? { ...c, count: json.total ?? 0, loading: false } : c));
        } else {
          setCards((prev) => prev.map((c, i) => i === idx ? { ...c, loading: false } : c));
        }
      } catch {
        setCards((prev) => prev.map((c, i) => i === idx ? { ...c, loading: false } : c));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={card.table} className={`bg-gradient-to-br ${CARD_COLORS[idx % CARD_COLORS.length]} border rounded-2xl p-6 transition-all hover:scale-[1.02]`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{ICONS[card.table] ?? "📊"}</span>
            <span className="text-xs text-white/40 uppercase tracking-wider font-medium">{card.table}</span>
          </div>
          {card.loading ? (
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
          ) : (
            <div className="text-4xl font-bold text-white">{card.count.toLocaleString()}</div>
          )}
          <p className="text-white/50 text-sm mt-1">Total records</p>
        </div>
      ))}
    </div>
  );
}
