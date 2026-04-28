import {
  AppConfigSchema,
  SafeConfig,
  ConfigWarning,
  PageDef,
  AppComponent,
  ApiDef,
  ApiAction,
  FieldDef,
  FieldType,
  NotificationEvent,
} from "@/types/config";

const VALID_ACTIONS: ApiAction[] = ["create", "read", "update", "delete"];
const VALID_FIELD_TYPES: FieldType[] = ["string", "email", "number", "boolean", "date", "text"];

/**
 * Normalizes a raw (potentially malformed) config JSON into a safe, guaranteed-shape config.
 * Never throws. Always returns { config, warnings }.
 */
export function normalizeConfig(raw: unknown): {
  config: SafeConfig;
  warnings: ConfigWarning[];
} {
  const warnings: ConfigWarning[] = [];

  // Ensure raw is an object
  const obj = (typeof raw === "object" && raw !== null && !Array.isArray(raw))
    ? (raw as Record<string, unknown>)
    : {};

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    warnings.push({ field: "root", message: "Config must be a JSON object, got: " + typeof raw, severity: "error" });
  }

  // ── appName ────────────────────────────────────────────────────────────────
  const appName = typeof obj.appName === "string" && obj.appName.trim()
    ? obj.appName.trim()
    : "Untitled App";
  if (!obj.appName) {
    warnings.push({ field: "appName", message: 'Missing appName, defaulted to "Untitled App"', severity: "warning" });
  }

  // ── auth ───────────────────────────────────────────────────────────────────
  const rawAuth = typeof obj.auth === "object" && obj.auth !== null ? (obj.auth as Record<string, unknown>) : {};
  const auth = { enabled: rawAuth.enabled !== false };

  // ── i18n ───────────────────────────────────────────────────────────────────
  const rawI18n = typeof obj.i18n === "object" && obj.i18n !== null ? (obj.i18n as Record<string, unknown>) : {};
  const defaultLang = typeof rawI18n.default === "string" ? rawI18n.default : "en";
  const languages = Array.isArray(rawI18n.languages) ? rawI18n.languages.filter((l) => typeof l === "string") as string[] : [defaultLang];
  const translations = (typeof rawI18n.translations === "object" && rawI18n.translations !== null)
    ? (rawI18n.translations as Record<string, Record<string, string>>)
    : {};
  const i18n = { default: defaultLang, languages, translations };

  // ── database.tables ────────────────────────────────────────────────────────
  const rawDb = typeof obj.database === "object" && obj.database !== null ? (obj.database as Record<string, unknown>) : {};
  const rawTables = typeof rawDb.tables === "object" && rawDb.tables !== null && !Array.isArray(rawDb.tables)
    ? (rawDb.tables as Record<string, unknown>)
    : {};
  const tables: SafeConfig["database"]["tables"] = {};

  for (const [tableName, tableDef] of Object.entries(rawTables)) {
    if (typeof tableDef !== "object" || tableDef === null) {
      warnings.push({ field: `database.tables.${tableName}`, message: `Table "${tableName}" definition is not an object, skipped`, severity: "warning" });
      continue;
    }
    const td = tableDef as Record<string, unknown>;
    const rawFields = typeof td.fields === "object" && td.fields !== null ? (td.fields as Record<string, unknown>) : {};
    const fields: Record<string, FieldDef> = {};

    for (const [fieldName, fieldDef] of Object.entries(rawFields)) {
      const fd = (typeof fieldDef === "object" && fieldDef !== null ? fieldDef : {}) as Record<string, unknown>;
      const rawType = fd.type as string;
      const type: FieldType = VALID_FIELD_TYPES.includes(rawType as FieldType) ? (rawType as FieldType) : "string";

      if (!VALID_FIELD_TYPES.includes(rawType as FieldType)) {
        warnings.push({
          field: `database.tables.${tableName}.fields.${fieldName}.type`,
          message: `Invalid/missing field type "${rawType}" for "${fieldName}" in table "${tableName}", defaulted to "string"`,
          severity: "warning",
        });
      }

      fields[fieldName] = {
        type,
        required: typeof fd.required === "boolean" ? fd.required : false,
        label: typeof fd.label === "string" ? fd.label : fieldName,
        placeholder: typeof fd.placeholder === "string" ? fd.placeholder : undefined,
      };
    }

    tables[tableName] = {
      userScoped: td.userScoped !== false,
      fields,
    };
  }

  // ── pages ──────────────────────────────────────────────────────────────────
  let rawPages = obj.pages;
  if (!Array.isArray(rawPages)) {
    if (rawPages !== undefined) {
      warnings.push({ field: "pages", message: "pages must be an array, defaulted to []", severity: "warning" });
    } else {
      warnings.push({ field: "pages", message: "Missing pages array, defaulted to []", severity: "warning" });
    }
    rawPages = [];
  }

  const pages: PageDef[] = (rawPages as unknown[]).map((p, idx) => {
    const page = (typeof p === "object" && p !== null ? p : {}) as Record<string, unknown>;

    const rawTitle = typeof page.title === "string" ? page.title.trim() : "";
    const title = rawTitle || "Untitled Page";
    if (!rawTitle) {
      warnings.push({ field: `pages[${idx}].title`, message: `Page ${idx} is missing a title, defaulted to "Untitled Page"`, severity: "warning" });
    }

    const rawRoute = typeof page.route === "string" ? page.route.trim() : "";
    const route = rawRoute || "/" + title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!rawRoute) {
      warnings.push({ field: `pages[${idx}].route`, message: `Page "${title}" is missing a route, auto-generated: "${route}"`, severity: "warning" });
    }

    const rawComponents = Array.isArray(page.components) ? page.components : [];
    const components: AppComponent[] = (rawComponents as unknown[]).map((c, cidx) => {
      const comp = (typeof c === "object" && c !== null ? c : {}) as Record<string, unknown>;
      const type = typeof comp.type === "string" && comp.type.trim() ? comp.type.trim() : "unknown";

      if (!comp.type) {
        warnings.push({ field: `pages[${idx}].components[${cidx}].type`, message: `Component ${cidx} on page "${title}" is missing a type, will show fallback`, severity: "warning" });
      }

      // Validate table reference for form/table components
      if ((type === "form" || type === "table") && comp.table) {
        if (!tables[comp.table as string]) {
          warnings.push({
            field: `pages[${idx}].components[${cidx}].table`,
            message: `Component "${type}" references table "${comp.table}" which is not defined in database.tables`,
            severity: "warning",
          });
        }
      }
      if ((type === "form" || type === "table") && !comp.table) {
        warnings.push({
          field: `pages[${idx}].components[${cidx}].table`,
          message: `Component "${type}" on page "${title}" is missing a table reference`,
          severity: "warning",
        });
      }

      return { ...comp, type } as AppComponent;
    });

    return { route, title, components };
  });

  // ── apis ───────────────────────────────────────────────────────────────────
  const rawApis = Array.isArray(obj.apis) ? obj.apis : [];
  const apis: ApiDef[] = (rawApis as unknown[]).map((a, idx) => {
    const api = (typeof a === "object" && a !== null ? a : {}) as Record<string, unknown>;
    const resource = typeof api.resource === "string" ? api.resource.trim() : `resource_${idx}`;
    const rawActions = Array.isArray(api.actions) ? api.actions : [];
    const actions: ApiAction[] = [];

    for (const act of rawActions) {
      if (VALID_ACTIONS.includes(act as ApiAction)) {
        actions.push(act as ApiAction);
      } else {
        warnings.push({ field: `apis[${idx}].actions`, message: `Invalid API action "${act}" for resource "${resource}", ignored`, severity: "warning" });
      }
    }

    return { resource, actions };
  });

  // ── notifications ──────────────────────────────────────────────────────────
  const rawNotifications = Array.isArray(obj.notifications) ? obj.notifications : [];
  const notifications: NotificationEvent[] = (rawNotifications as unknown[]).map((n) => {
    const notif = (typeof n === "object" && n !== null ? n : {}) as Record<string, unknown>;
    return {
      event: typeof notif.event === "string" ? notif.event : "",
      message: typeof notif.message === "string" ? notif.message : "Action performed",
      type: (notif.type === "toast" || notif.type === "db" || notif.type === "both") ? notif.type : "both",
    };
  });

  const config: SafeConfig = {
    appName,
    auth,
    i18n,
    database: { tables },
    pages,
    apis,
    notifications,
  };

  return { config, warnings };
}

/**
 * Get allowed actions for a resource from normalized config.
 */
export function getAllowedActions(config: SafeConfig, resource: string): ApiAction[] {
  const api = config.apis.find((a) => a.resource === resource);
  return api?.actions ?? [];
}

/**
 * Check if a resource exists in the config.
 */
export function resourceExists(config: SafeConfig, resource: string): boolean {
  return resource in config.database.tables;
}

/**
 * Get the notification config for a specific event.
 */
export function getNotificationConfig(config: SafeConfig, event: string): NotificationEvent | undefined {
  return config.notifications.find((n) => n.event === event);
}

/**
 * Returns all available resource names.
 */
export function getAvailableResources(config: SafeConfig): string[] {
  return Object.keys(config.database.tables);
}
