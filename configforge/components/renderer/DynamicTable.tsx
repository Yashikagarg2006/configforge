"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TableComponent, SafeConfig, ConfigWarning } from "@/types/config";
import { useTranslation } from "@/contexts/I18nContext";
import ConfigWarnings from "@/components/ConfigWarnings";

interface Props {
  component: TableComponent & Record<string, unknown>;
  config: SafeConfig;
  warnings: ConfigWarning[];
  refreshKey?: number;
}

type Row = Record<string, unknown> & { id: string };

export default function DynamicTable({ component, config, warnings, refreshKey }: Props) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const compWarnings: ConfigWarning[] = [];

  if (!component.table) {
    compWarnings.push({ field: "table", message: "Table component is missing a table reference", severity: "warning" });
    return <ConfigWarnings warnings={compWarnings} />;
  }
  if (!config.database.tables[component.table]) {
    compWarnings.push({ field: "table", message: `Table "${component.table}" not found in config`, severity: "warning" });
    return <ConfigWarnings warnings={compWarnings} />;
  }

  const columns = component.columns ?? Object.keys(config.database.tables[component.table]?.fields ?? {});

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dynamic/${component.table}`);
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Failed to load"); return; }
      const json = await res.json();
      setRows(json.records ?? []);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [component.table, refreshKey]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/dynamic/${component.table}/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Deleted"); fetchData(); }
      else { const j = await res.json(); toast.error(j.error ?? "Delete failed"); }
    } catch { toast.error("Network error"); }
    finally { setDeletingId(null); }
  };

  if (loading) return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
      {[1,2,3].map(i => <div key={i} className="h-10 bg-white/5 rounded mb-2" />)}
    </div>
  );

  if (error) return (
    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 mb-6 text-rose-400">
      ⚠ {error} <button onClick={fetchData} className="ml-2 underline text-sm">Retry</button>
    </div>
  );

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 overflow-x-auto">
      {rows.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <div className="text-4xl mb-2">📭</div>
          <p>No records yet</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col) => (
                <th key={col} className="text-left py-3 px-4 text-white/50 font-medium">{t(col) || col}</th>
              ))}
              <th className="text-left py-3 px-4 text-white/50 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="py-3 px-4 text-white/80">
                    {row[col] !== undefined && row[col] !== null ? String(row[col]) : <span className="text-white/30">—</span>}
                  </td>
                ))}
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleDelete(row.id)}
                    disabled={deletingId === row.id}
                    className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded border border-rose-500/30 hover:border-rose-400 transition disabled:opacity-40"
                  >
                    {deletingId === row.id ? "..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-3 text-xs text-white/30">{rows.length} record{rows.length !== 1 ? "s" : ""}</div>
    </div>
  );
}
