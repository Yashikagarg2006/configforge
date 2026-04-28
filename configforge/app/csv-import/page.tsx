"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { toast } from "sonner";
import { normalizeConfig } from "@/lib/config-normalizer";
import { SafeConfig } from "@/types/config";

interface ImportSummary { imported: number; failed: number; skipped: number; errors: string[]; }

export default function CsvImportPage() {
  const [config, setConfig] = useState<SafeConfig | null>(null);
  const [resource, setResource] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows]     = useState<Record<string, string>[]>([]);
  const [mapping, setMapping]     = useState<Record<string, string>>({});
  const [step, setStep]           = useState<1 | 2 | 3 | 4>(1);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary]     = useState<ImportSummary | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/configs");
      if (!res.ok) return;
      const data = await res.json();
      if (data.configs?.length > 0) {
        const cfgRes = await fetch(`/api/configs/${data.configs[0].id}`);
        if (cfgRes.ok) {
          const cfgData = await cfgRes.json();
          const { config: c } = normalizeConfig(cfgData.config?.config ?? {});
          setConfig(c);
          const resources = Object.keys(c.database.tables);
          if (resources.length > 0) setResource(resources[0]);
        }
      }
    })();
  }, []);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (csvRows.length > 0) { setCsvHeaders([]); setCsvRows([]); setMapping({}); }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) { toast.error("CSV is empty"); return; }
        const headers = results.meta.fields ?? [];
        setCsvHeaders(headers);
        setCsvRows(results.data);

        // Auto-map headers to config fields
        if (config && resource && config.database.tables[resource]) {
          const fields = Object.keys(config.database.tables[resource].fields);
          const autoMap: Record<string, string> = {};
          for (const h of headers) {
            const match = fields.find((f) => f.toLowerCase() === h.toLowerCase());
            if (match) autoMap[h] = match;
          }
          setMapping(autoMap);
        }
        setStep(2);
        toast.success(`Parsed ${results.data.length} rows`);
      },
      error: (err) => toast.error("Parse error: " + err.message),
    });
  }, [config, resource, csvRows.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "text/csv": [".csv"] }, multiple: false,
  });

  const handleImport = async () => {
    if (!config || !resource) return;
    setImporting(true);
    const result: ImportSummary = { imported: 0, failed: 0, skipped: 0, errors: [] };

    for (const row of csvRows) {
      // Check if row is effectively empty
      const isBlank = Object.values(row).every((v) => !v?.trim());
      if (isBlank) { result.skipped++; continue; }

      // Build mapped record
      const record: Record<string, unknown> = {};
      for (const [csvCol, fieldKey] of Object.entries(mapping)) {
        if (fieldKey && row[csvCol] !== undefined) record[fieldKey] = row[csvCol];
      }

      if (Object.keys(record).length === 0) { result.skipped++; continue; }

      try {
        const res = await fetch(`/api/dynamic/${resource}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        });
        if (res.ok) { result.imported++; }
        else {
          const j = await res.json();
          result.failed++;
          result.errors.push(`Row ${result.imported + result.failed}: ${j.error ?? "Unknown error"}`);
        }
      } catch (e) {
        result.failed++;
        result.errors.push(`Row ${result.imported + result.failed}: Network error`);
      }
    }

    setSummary(result);
    setStep(4);
    setImporting(false);

    if (result.imported > 0) toast.success(`Imported ${result.imported} records`);
    if (result.failed > 0) toast.error(`${result.failed} rows failed`);
  };

  const resources = config ? Object.keys(config.database.tables) : [];
  const configFields = config && resource && config.database.tables[resource]
    ? Object.keys(config.database.tables[resource].fields)
    : [];

  return (
    <div className="max-w-3xl mx-auto page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">CSV Import</h1>
        <p className="text-white/40 text-sm mt-1">Import bulk data from CSV files into any resource</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {["Select Resource", "Upload CSV", "Map Columns", "Summary"].map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${step > i + 1 ? "opacity-100" : step === i + 1 ? "opacity-100" : "opacity-30"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step > i + 1 ? "bg-emerald-500 border-emerald-500 text-white" : step === i + 1 ? "border-violet-500 text-violet-400" : "border-white/20 text-white/30"}`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? "text-white" : "text-white/40"}`}>{label}</span>
            </div>
            {i < 3 && <div className={`flex-1 h-px mx-2 ${step > i + 1 ? "bg-emerald-500/50" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select resource */}
      {step === 1 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">Select Resource</h2>
          {resources.length === 0 ? (
            <p className="text-white/40 text-sm">No resources found. <a href="/config-editor" className="text-violet-400 hover:underline">Add tables to your config first.</a></p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {resources.map((r) => (
                  <button key={r} onClick={() => setResource(r)}
                    className={`p-4 rounded-xl border text-left transition-all ${resource === r ? "border-violet-500 bg-violet-500/10 text-white" : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"}`}>
                    <div className="text-lg mb-1">📋</div>
                    <div className="font-medium text-sm">{r}</div>
                    <div className="text-xs opacity-50 mt-0.5">{config?.database.tables[r] ? Object.keys(config.database.tables[r].fields).length : 0} fields</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} disabled={!resource}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition disabled:opacity-40">
                Continue →
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 2: Upload CSV */}
      {step === 2 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setStep(1)} className="text-white/40 hover:text-white text-sm transition">← Back</button>
            <h2 className="font-semibold text-white">Upload CSV for <span className="text-violet-400">{resource}</span></h2>
          </div>

          <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive ? "border-violet-500 bg-violet-500/10" : "border-white/10 hover:border-white/25 hover:bg-white/5"}`}>
            <input {...getInputProps()} />
            <div className="text-5xl mb-4">📂</div>
            <p className="text-white/70 font-medium">{isDragActive ? "Drop your CSV here" : "Drag & drop a CSV, or click to browse"}</p>
            <p className="text-white/30 text-sm mt-2">Supports .csv files • UTF-8 encoding recommended</p>
          </div>

          {csvRows.length > 0 && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
              ✓ {csvRows.length} rows, {csvHeaders.length} columns detected — <button onClick={() => setStep(3)} className="underline">Continue to mapping →</button>
            </div>
          )}

          <p className="text-white/25 text-xs mt-4">Expected fields for <strong className="text-white/40">{resource}</strong>: {configFields.join(", ")}</p>
        </div>
      )}

      {/* Step 3: Column mapping */}
      {step === 3 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(2)} className="text-white/40 hover:text-white text-sm transition">← Back</button>
              <h2 className="font-semibold text-white">Map CSV Columns</h2>
            </div>
            <span className="text-white/30 text-xs">{csvRows.length} rows ready</span>
          </div>

          <div className="space-y-3 mb-6">
            {csvHeaders.map((h) => (
              <div key={h} className="flex items-center gap-4">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 font-mono">{h}</div>
                <span className="text-white/30 text-xs">→</span>
                <select
                  value={mapping[h] ?? ""}
                  onChange={(e) => setMapping({ ...mapping, [h]: e.target.value })}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">— Skip —</option>
                  {configFields.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="mb-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/5">
                  {Object.values(mapping).filter(Boolean).map((f) => (
                    <th key={f} className="px-3 py-2 text-left text-white/50 font-medium">{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvRows.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Object.entries(mapping).filter(([, v]) => v).map(([csvCol, field]) => (
                      <td key={field} className="px-3 py-2 text-white/60">{row[csvCol] ?? "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvRows.length > 3 && <p className="text-center py-2 text-white/25 text-xs">+{csvRows.length - 3} more rows</p>}
          </div>

          <button
            onClick={handleImport} disabled={importing || Object.values(mapping).every((v) => !v)}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {importing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Importing {csvRows.length} rows…</> : `Import ${csvRows.length} Rows →`}
          </button>
        </div>
      )}

      {/* Step 4: Summary */}
      {step === 4 && summary && (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">{summary.failed === 0 ? "🎉" : "⚠️"}</div>
          <h2 className="text-xl font-bold text-white mb-6">Import Complete</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="text-3xl font-bold text-emerald-400">{summary.imported}</div>
              <div className="text-white/50 text-sm mt-1">Imported</div>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
              <div className="text-3xl font-bold text-rose-400">{summary.failed}</div>
              <div className="text-white/50 text-sm mt-1">Failed</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="text-3xl font-bold text-amber-400">{summary.skipped}</div>
              <div className="text-white/50 text-sm mt-1">Skipped</div>
            </div>
          </div>

          {summary.errors.length > 0 && (
            <details className="text-left mb-4">
              <summary className="text-rose-400 text-sm cursor-pointer mb-2">Show {summary.errors.length} error{summary.errors.length !== 1 ? "s" : ""}</summary>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {summary.errors.map((e, i) => <p key={i} className="text-rose-400/70 text-xs font-mono">{e}</p>)}
              </div>
            </details>
          )}

          <div className="flex items-center justify-center gap-3">
            <button onClick={() => { setStep(1); setCsvHeaders([]); setCsvRows([]); setMapping({}); setSummary(null); }}
              className="px-5 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition">
              Import Again
            </button>
            <a href="/app" className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition">
              View in App →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
