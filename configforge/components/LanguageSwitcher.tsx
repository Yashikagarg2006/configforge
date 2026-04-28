"use client";

import { useTranslation } from "@/contexts/I18nContext";

export default function LanguageSwitcher() {
  const { language, setLanguage, languages } = useTranslation();
  if (languages.length <= 1) return null;

  const LANG_LABELS: Record<string, string> = { en: "EN", hi: "हिं", fr: "FR", es: "ES", de: "DE", zh: "中", ar: "ع", pt: "PT" };

  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
            language === lang
              ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
              : "text-white/50 hover:text-white hover:bg-white/10"
          }`}
        >
          {LANG_LABELS[lang] ?? lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
