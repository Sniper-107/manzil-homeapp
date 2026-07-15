"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      className="text-xs border border-line rounded-lg px-2 py-1 text-ink-soft hover:bg-stone-dim transition-colors"
    >
      {language === "en" ? "العربية" : "English"}
    </button>
  );
}
