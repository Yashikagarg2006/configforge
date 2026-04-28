"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, ZodTypeAny } from "zod";
import { toast } from "sonner";
import { FormComponent, SafeConfig, ConfigWarning, FieldDef } from "@/types/config";
import { useTranslation } from "@/contexts/I18nContext";
import ConfigWarnings from "@/components/ConfigWarnings";

interface Props {
  component: FormComponent & Record<string, unknown>;
  config: SafeConfig;
  warnings: ConfigWarning[];
  onSuccess?: () => void;
}

function buildSchema(fields: string[], tableDef: Record<string, FieldDef>) {
  const shape: Record<string, ZodTypeAny> = {};
  for (const f of fields) {
    const def = tableDef[f];
    if (!def) { shape[f] = z.string().optional(); continue; }
    let field: ZodTypeAny;
    switch (def.type) {
      case "email":   field = z.string().email("Invalid email"); break;
      case "number":  field = z.coerce.number(); break;
      case "boolean": field = z.coerce.boolean(); break;
      default:        field = z.string().min(1, `${f} is required`);
    }
    if (!def.required) field = field.optional();
    shape[f] = field;
  }
  return z.object(shape);
}

export default function DynamicForm({ component, config, warnings, onSuccess }: Props) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const compWarnings: ConfigWarning[] = [];

  if (!component.table) {
    compWarnings.push({ field: "table", message: "Form is missing a table reference", severity: "warning" });
    return <ConfigWarnings warnings={compWarnings} />;
  }

  const tableDef = config.database.tables[component.table];
  if (!tableDef) {
    compWarnings.push({ field: "table", message: `Table "${component.table}" not found in config`, severity: "warning" });
    return <ConfigWarnings warnings={compWarnings} />;
  }

  const fields = component.fields ?? Object.keys(tableDef.fields);
  const schema = buildSchema(fields, tableDef.fields);
  type FormData = z.infer<typeof schema>;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/dynamic/${component.table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to submit");
        return;
      }
      toast.success(t("submit") + " ✓");
      reset();
      onSuccess?.();
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const title = t(component.title ?? "");

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
      {title && <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((fieldKey) => {
          const def = tableDef.fields[fieldKey];
          const label = t(def?.label ?? fieldKey) || fieldKey;
          const inputType = def?.type === "email" ? "email" : def?.type === "number" ? "number" : def?.type === "date" ? "date" : "text";
          const err = errors[fieldKey];
          return (
            <div key={fieldKey}>
              <label className="block text-sm font-medium text-white/70 mb-1">{label}{def?.required && <span className="text-rose-400 ml-1">*</span>}</label>
              <input
                {...register(fieldKey)}
                type={inputType}
                placeholder={def?.placeholder ?? label}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
              {err && <p className="text-rose-400 text-xs mt-1">{String(err.message)}</p>}
            </div>
          );
        })}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("submit")}...</>
          ) : t("submit")}
        </button>
      </form>
    </div>
  );
}
