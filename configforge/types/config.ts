// ─── Field ────────────────────────────────────────────────────────────────────
export type FieldType = "string" | "email" | "number" | "boolean" | "date" | "text";

export interface FieldDef {
  type: FieldType;
  required?: boolean;
  label?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}

// ─── Table ───────────────────────────────────────────────────────────────────
export interface TableDef {
  userScoped?: boolean;
  fields: Record<string, FieldDef>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export interface BaseComponent {
  type: string;
}

export interface HeadingComponent extends BaseComponent {
  type: "heading";
  text?: string;
  level?: 1 | 2 | 3 | 4;
}

export interface FormComponent extends BaseComponent {
  type: "form";
  title?: string;
  table?: string;
  fields?: string[];
  submitLabel?: string;
}

export interface TableComponent extends BaseComponent {
  type: "table";
  table?: string;
  columns?: string[];
  pageSize?: number;
}

export interface DashboardComponent extends BaseComponent {
  type: "dashboard";
  tables?: string[];
}

export interface ChartComponent extends BaseComponent {
  type: "chart";
  table?: string;
  xField?: string;
  yField?: string;
  chartType?: "bar" | "line" | "pie";
}

export interface UnknownComponent extends BaseComponent {
  type: string;
  [key: string]: unknown;
}

export type AppComponent =
  | HeadingComponent
  | FormComponent
  | TableComponent
  | DashboardComponent
  | ChartComponent
  | UnknownComponent;

// ─── Page ─────────────────────────────────────────────────────────────────────
export interface PageDef {
  route: string;
  title: string;
  components: AppComponent[];
}

// ─── I18n ─────────────────────────────────────────────────────────────────────
export interface I18nConfig {
  default?: string;
  languages?: string[];
  translations?: Record<string, Record<string, string>>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthConfig {
  enabled?: boolean;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export type ApiAction = "create" | "read" | "update" | "delete";

export interface ApiDef {
  resource: string;
  actions: ApiAction[];
}

// ─── Notification event ───────────────────────────────────────────────────────
export interface NotificationEvent {
  event: string;      // e.g. "students.create"
  message: string;
  type?: "toast" | "db" | "both";
}

// ─── Root Config ──────────────────────────────────────────────────────────────
export interface AppConfigSchema {
  appName?: string;
  auth?: AuthConfig;
  i18n?: I18nConfig;
  database?: {
    tables?: Record<string, TableDef>;
  };
  pages?: PageDef[];
  apis?: ApiDef[];
  notifications?: NotificationEvent[];
}

// ─── Warning ──────────────────────────────────────────────────────────────────
export interface ConfigWarning {
  field: string;
  message: string;
  severity: "warning" | "error" | "info";
}

// ─── Safe (normalized) config – all optional fields guaranteed ────────────────
export interface SafeConfig {
  appName: string;
  auth: { enabled: boolean };
  i18n: Required<I18nConfig>;
  database: { tables: Record<string, TableDef> };
  pages: PageDef[];
  apis: ApiDef[];
  notifications: NotificationEvent[];
}
