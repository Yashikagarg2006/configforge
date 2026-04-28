"use client";

import { AppComponent, SafeConfig } from "@/types/config";
import { ConfigWarning } from "@/types/config";
import { resolveComponent } from "./component-registry";

interface Props {
  component: AppComponent;
  config: SafeConfig;
  warnings: ConfigWarning[];
}

export default function ComponentRenderer({ component, config, warnings }: Props) {
  const Component = resolveComponent(component.type);
  return <Component component={component} config={config} warnings={warnings} />;
}
