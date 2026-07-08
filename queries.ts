import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndHousehold } from "@/lib/household";
import type { Asset } from "@/types/database";
import { ASSET_CATEGORIES } from "@/types/database";

function formatSAR(amount: number | null) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AssetsPage() {
  const { household } = await getCurrentUserAndHousehold();
  if (!household) return null;

  const supabase = await createClient();
  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("household_id", household.id)
    .order("created_at", { ascending: false });

  const list = (assets ?? []) as Asset[];

  const grouped = ASSET_CATEGORIES.map((category) => ({
    category,
    items: list.filter((a) => a.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl text-ink">Assets</h1>
        <Link
          href="/assets/new"
          className="bg-teal text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-dark transition-colors"
        >
          + Add
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-line rounded-xl p-8 text-center">
          <p className="text-ink-soft text-sm">
            Nothing tracked yet. Add your first purchase — snap a photo of the receipt and
            we&apos;ll fill in the details.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
                {group.category} ({group.items.length})
              </h2>
              <div className="space-y-2">
                {group.items.map((asset) => (
                  <Link
                    key={asset.id}
                    href={`/assets/${asset.id}`}
                    className="flex items-center justify-between bg-white border border-line rounded-xl p-3.5 hover:border-teal transition-colors"
                  >
                    <div>
                      <p className="text-ink font-medium">{asset.name}</p>
                      <p className="text-xs text-ink-soft mt-0.5">{asset.vendor ?? "—"}</p>
                    </div>
                    <p className="font-mono text-sm text-ink-soft">{formatSAR(asset.price)}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
