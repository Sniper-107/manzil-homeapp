"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { StringKey } from "@/lib/i18n/strings";

export function NavLink({ href, labelKey }: { href: string; labelKey: StringKey }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const active = pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex-1 text-center py-3 text-sm transition-colors ${
        active ? "text-teal" : "text-ink-soft"
      } hover:text-teal hover:bg-teal-tint`}
    >
      {t(labelKey)}
    </Link>
  );
}
