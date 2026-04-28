"use client";

import { HeadingComponent as HeadingComp } from "@/types/config";
import { SafeConfig, ConfigWarning } from "@/types/config";
import { useTranslation } from "@/contexts/I18nContext";

interface Props {
  component: HeadingComp & Record<string, unknown>;
  config: SafeConfig;
  warnings: ConfigWarning[];
}

export default function HeadingComponent({ component }: Props) {
  const { t } = useTranslation();
  const text = t(component.text ?? "") || component.text || "Heading";
  const level = component.level ?? 1;

  const classes: Record<number, string> = {
    1: "text-3xl font-bold text-white mb-6",
    2: "text-2xl font-semibold text-white mb-4",
    3: "text-xl font-semibold text-white/90 mb-3",
    4: "text-lg font-medium text-white/80 mb-2",
  };

  const Tag = `h${level}` as any;
  return <Tag className={classes[level] ?? classes[1]}>{text}</Tag>;
}
