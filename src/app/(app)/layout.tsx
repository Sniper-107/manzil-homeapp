import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserAndHousehold } from "@/lib/household";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, household } = await getCurrentUserAndHousehold();

  if (!user) redirect("/login");
  if (!household) redirect("/onboarding");

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-16">
      <header className="border-b border-line bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="font-serif text-lg text-ink leading-tight">{household.name}</p>
        </div>
        <Link href="/household" className="text-ink-soft text-sm">
          Settings
        </Link>
      </header>

      <main className="flex-1">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-line flex">
        <NavLink href="/dashboard" label="Dashboard" />
        <NavLink href="/assets" label="Assets" />
        <NavLink href="/planning" label="Planning" />
        <NavLink href="/maintenance" label="Maintenance" />
      </nav>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex-1 text-center py-3 text-sm text-ink-soft hover:text-teal hover:bg-teal-tint transition-colors"
    >
      {label}
    </Link>
  );
}
