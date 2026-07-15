import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndHousehold } from "@/lib/household";
import type { PlanningItem } from "@/types/database";

function formatSAR(amount: number | null) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function PlanningPage() {
  const { household } = await getCurrentUserAndHousehold();
  if (!household) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("planning_items")
    .select("*")
    .eq("household_id", household.id)
    .order("created_at", { ascending: false });

  const items = (data ?? []) as PlanningItem[];
  const active = items.filter((i) => i.status === "planned");
  const needSoon = active.filter((i) => i.priority === "need_soon");
  const later = active.filter((i) => i.priority === "later");
  const purchased = items.filter((i) => i.status === "purchased");

  const totalPlanned = active.reduce((sum, i) => sum + (i.expected_price ?? 0), 0);
  const budget = household.planning_budget;
  const overBudget = budget !== null && totalPlanned > budget;
  const budgetPct = budget && budget > 0 ? Math.min(100, (totalPlanned / budget) * 100) : null;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl text-ink">Planning</h1>
        <div className="flex gap-2">
          <Link
            href="/planning/bulk"
            className="border border-teal text-teal rounded-lg px-3 py-2 text-sm font-medium hover:bg-teal-tint transition-colors"
          >
            Bulk add
          </Link>
          <Link
            href="/planning/new"
            className="bg-teal text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-dark transition-colors"
          >
            + Add
          </Link>
        </div>
      </div>

      <div className="bg-white border border-line rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-1.5">
          <p className="text-xs text-ink-soft">Planned so far</p>
          <p className={`font-mono text-sm ${overBudget ? "text-rust" : "text-ink"}`}>
            {formatSAR(totalPlanned)}
            {budget !== null && <span className="text-ink-soft"> / {formatSAR(budget)}</span>}
          </p>
        </div>
        {budgetPct !== null && (
          <div className="h-1.5 bg-stone-dim rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${overBudget ? "bg-rust" : "bg-teal"}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        )}
        {overBudget && (
          <p className="text-xs text-rust mt-1.5">
            Over your planning budget by {formatSAR(totalPlanned - (budget ?? 0))}
          </p>
        )}
        {budget === null && (
          <p className="text-xs text-ink-soft mt-1">
            Set a planning budget in{" "}
            <Link href="/household" className="text-teal underline">
              Household settings
            </Link>{" "}
            to track against it.
          </p>
        )}
      </div>

      {active.length === 0 && purchased.length === 0 ? (
        <div className="bg-white border border-line rounded-xl p-8 text-center">
          <p className="text-ink-soft text-sm">
            Nothing on your wishlist yet — add things you&apos;re planning to buy.
          </p>
        </div>
      ) : (
        <>
          {needSoon.length > 0 && (
            <PlanningSection title="Need soon" items={needSoon} />
          )}
          {later.length > 0 && <PlanningSection title="Later" items={later} />}
          {purchased.length > 0 && (
            <PlanningSection title="Purchased" items={purchased} muted />
          )}
        </>
      )}
    </div>
  );
}

function PlanningSection({
  title,
  items,
  muted,
}: {
  title: string;
  items: PlanningItem[];
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
        {title} ({items.length})
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/planning/${item.id}/edit`}
            className={`flex items-center justify-between bg-white border border-line rounded-xl p-3.5 hover:border-teal transition-colors ${
              muted ? "opacity-60" : ""
            }`}
          >
            <div>
              <p className="text-ink font-medium">{item.name}</p>
              <p className="text-xs text-ink-soft mt-0.5">
                {item.category}
                {item.expected_vendor ? ` · ${item.expected_vendor}` : ""}
              </p>
            </div>
            <p className="font-mono text-sm text-ink-soft">{formatSAR(item.expected_price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
