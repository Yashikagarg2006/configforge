import { ComponentType } from "react";
import { AppComponent, SafeConfig } from "@/types/config";
import { ConfigWarning } from "@/types/config";

export interface ComponentProps {
  component: AppComponent;
  config: SafeConfig;
  warnings: ConfigWarning[];
}

// Lazy imports to avoid circular deps — resolved at runtime
import dynamic from "next/dynamic";

const HeadingComponent = dynamic(() => import("./HeadingComponent"));
const DynamicForm = dynamic(() => import("./DynamicForm"));
const DynamicTable = dynamic(() => import("./DynamicTable"));
const DashboardCards = dynamic(() => import("./DashboardCards"));
const ChartPlaceholder = dynamic(() => import("./ChartPlaceholder"));
const UnsupportedComponent = dynamic(() => import("./UnsupportedComponent"));

type RegistryEntry = ComponentType<ComponentProps>;

const componentRegistry: Record<string, RegistryEntry> = {
  heading: HeadingComponent as RegistryEntry,
  form: DynamicForm as RegistryEntry,
  table: DynamicTable as RegistryEntry,
  dashboard: DashboardCards as RegistryEntry,
  chart: ChartPlaceholder as RegistryEntry,
};

/**
 * Resolve a component by type string.
 * Returns UnsupportedComponent for unknown types — never crashes.
 * To add a new component type: add one entry to componentRegistry above.
 */
export function resolveComponent(type: string): RegistryEntry {
  return componentRegistry[type] ?? (UnsupportedComponent as RegistryEntry);
}

export { componentRegistry };
