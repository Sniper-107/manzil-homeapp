import { redirect } from "next/navigation";
import { getCurrentUserAndHousehold, getUserLanguage } from "@/lib/household";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NavLink } from "./NavLink";
import { SettingsLink } from "./SettingsLink";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, household } = await getCurrentUserAndHousehold();
  const language = await getUserLanguage();

  if (!user) redirect("/login");
  if (!household) redirect("/onboarding");

  return (
    <LanguageProvider initialLanguage={language}>
      <div className="flex-1 flex flex-col min-h-screen pb-28">
        <header className="border-b border-line bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="font-serif text-lg text-ink leading-tight">{household.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <SettingsLink />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <nav
          className="fixed bottom-0 inset-x-0 bg-white border-t border-line flex pb-6"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
        >
          <NavLink href="/dashboard" labelKey="nav_dashboard" />
          <NavLink href="/assets" labelKey="nav_assets" />
          <NavLink href="/planning" labelKey="nav_planning" />
          <NavLink href="/maintenance" labelKey="nav_maintenance" />
        </nav>
      </div>
    </LanguageProvider>
  );
}

