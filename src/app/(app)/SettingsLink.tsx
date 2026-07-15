"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function SettingsLink() {
  const { t } = useLanguage();
  return (
    <Link href="/household" className="text-ink-soft text-sm">
      {t("settings")}
    </Link>
  );
}
