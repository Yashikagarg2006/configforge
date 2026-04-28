"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { SafeConfig } from "@/types/config";

interface I18nContextValue {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  languages: string[];
}

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (k) => k,
  languages: ["en"],
});

export function I18nProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: SafeConfig;
}) {
  const [language, setLanguage] = useState(config.i18n.default || "en");

  const t = useCallback(
    (key: string): string => {
      const translations = config.i18n.translations;
      if (!translations) return key;
      const langMap = translations[language];
      if (langMap && typeof langMap[key] === "string") return langMap[key];
      // Fallback to default language
      const defaultMap = translations[config.i18n.default || "en"];
      if (defaultMap && typeof defaultMap[key] === "string") return defaultMap[key];
      // Final fallback: return key as-is
      return key;
    },
    [language, config.i18n]
  );

  return (
    <I18nContext.Provider
      value={{ language, setLanguage, t, languages: config.i18n.languages || ["en"] }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
