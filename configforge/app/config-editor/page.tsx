"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { normalizeConfig } from "@/lib/config-normalizer";
import ConfigWarnings from "@/components/ConfigWarnings";
import { ConfigWarning } from "@/types/config";
import { SAMPLE_CONFIG } from "@/lib/sample-config";

export default function ConfigEditorPage() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [warnings, setWarnings] = useState<ConfigWarning[]>([]);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [configName, setConfigName] = useState("My App Config");
  const [savedId, setSavedId] = useState<string | null>(null);

  // Load existing config on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/configs");
        if (!res.ok) return;
        const data = await res.json();
        if (data.configs?.length > 0) {
          const first = data.configs[0];
          setSavedId(first.id);
          setConfigName(first.name);
          const cfgRes = await fetch(`/api/configs/${first.id}`);
          if (cfgRes.ok) {
            const cfgData = await cfgRes.json();
            setRaw(JSON.stringify(cfgData.config?.config ?? SAMPLE_CONFIG, null, 2));
          }
        } else {
          setRaw(JSON.stringify(SAMPLE_CONFIG, null, 2));
        }
      } catch {
        setRaw(JSON.stringify(SAMPLE_CONFIG, null, 2));
      }
    })();
  }, []);

  const handleChange = (val: string) => {
    setRaw(val);
    try {
      const parsed = JSON.parse(val);
      const { warnings: w } = normalizeConfig(parsed);
      setWarnings(w);
      setJsonError(null);
    } catch (e) {
      setJsonError("Invalid JSON: " + (e instanceof Error ? e.message : String(e)));
      setWarnings([]);
    }
  };

  const handleSave = async () => {
    if (jsonError) { toast.error("Fix JSON errors before saving"); return; }
    setSaving(true);
    try {
      const parsed = JSON.parse(raw);
      const res = await fetch("/api/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: configName, config: parsed }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Save failed"); return; }
      setSavedId(data.config?.id);
      toast.success("Config saved ✓");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleReset = () => {
    setRaw(JSON.stringify(SAMPLE_CONFIG, null, 2));
    const { warnings: w } = normalizeConfig(SAMPLE_CONFIG);
    setWarnings(w);
    setJsonError(null);
    toast.info("Reset to sample config");
  };

  const errorCount  = warnings.filter((w) => w.severity === "error").length;
  const warnCount   = warnings.filter((w) => w.severity === "warning").length;

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Config Editor</h1>
          <p className="text-white/40 text-sm mt-0.5">Define your app structure using JSON</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReset} className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition">
            ↺ Reset to Sample
          </button>
          <button
            onClick={() => router.push("/app")}
            disabled={!!jsonError || !savedId}
            className="px-4 py-2 rounded-xl border border-violet-500/40 text-violet-300 hover:bg-violet-500/10 text-sm transition disabled:opacity-40"
          >
            👁 Preview App
          </button>
          <button
            onClick={handleSave} disabled={saving || !!jsonError}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : "💾 Save Config"}
          </button>
        </div>
      </div>

      {/* Config name */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Config Name</label>
        <input
          value={configName} onChange={(e) => setConfigName(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-64 transition"
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        {jsonError
          ? <span className="text-rose-400 font-medium">✖ {jsonError}</span>
          : <span className="text-emerald-400 font-medium">✓ Valid JSON</span>
        }
        {!jsonError && warnCount > 0 && <span className="text-amber-400">{warnCount} warning{warnCount !== 1 ? "s" : ""}</span>}
        {!jsonError && errorCount > 0 && <span className="text-rose-400">{errorCount} error{errorCount !== 1 ? "s" : ""}</span>}
        <span className="text-white/20 ml-auto">{raw.length.toLocaleString()} chars</span>
      </div>

      {/* Warnings panel */}
      {warnings.length > 0 && !jsonError && <ConfigWarnings warnings={warnings} title="Config Analysis" />}

      {/* Editor */}
      <textarea
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        className="json-editor w-full h-[55vh] p-5"
        spellCheck={false}
        placeholder="Paste your JSON config here..."
      />

      {/* Help */}
      <div className="mt-4 glass rounded-xl p-4 text-xs text-white/40 space-y-1">
        <p><span className="text-violet-400 font-mono">appName</span> — Display name of your app</p>
        <p><span className="text-violet-400 font-mono">database.tables</span> — Define resources (students, tasks, orders…)</p>
        <p><span className="text-violet-400 font-mono">pages</span> — Pages with components: form, table, dashboard, chart, heading</p>
        <p><span className="text-violet-400 font-mono">apis</span> — Enable CRUD actions per resource</p>
        <p><span className="text-violet-400 font-mono">i18n</span> — Add multi-language support with translations object</p>
        <p><span className="text-violet-400 font-mono">notifications</span> — Configure toast/DB events on create/update/delete</p>
      </div>
    </div>
  );
}
