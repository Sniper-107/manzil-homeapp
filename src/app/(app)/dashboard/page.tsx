import Link from "next/link";
import { getCurrentUserAndHousehold } from "@/lib/household";
import {
  getUrgentWarranties,
  getUrgentMaintenance,
  getHouseholdStats,
  getNextPurchases,
} from "@/lib/queries";
import { StatusStamp } from "@/components/StatusStamp";

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSAR(amount: number | null) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage() {
  const { household } = await getCurrentUserAndHousehold();
  if (!household) return null;

  const [warranties, maintenance, stats, nextPurchases] = await Promise.all([
    getUrgentWarranties(household.id),
    getUrgentMaintenance(household.id),
    getHouseholdStats(household.id),
    getNextPurchases(household.id),
  ]);

  const topPurchases = nextPurchases.slice(0, 4);
  const topMaintenance = maintenance.slice(0, 4);

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-2xl font-serif text-ink">{stats.assetCount}</p>
          <p className="text-xs text-ink-soft mt-0.5">Assets tracked</p>
        </div>
        <div className="bg-white border border-line rounded-xl p-4">
          <p className={`text-2xl font-serif font-mono ${stats.expiredCount > 0 ? "text-rust" : "text-ink"}`}>
            {stats.expiredCount}
          </p>
          <p className="text-xs text-ink-soft mt-0.5">Warranty expired</p>
        </div>
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-lg font-serif text-ink font-mono">
            {formatSAR(stats.totalValue)}
          </p>
          <p className="text-xs text-ink-soft mt-0.5">Total value</p>
        </div>
      </div>

      {warranties.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
            Warranty expiring soon
          </h2>
          <div className="space-y-2">
            {warranties.map((asset) => (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="flex items-center justify-between bg-white border border-line rounded-xl p-3.5 hover:border-teal transition-colors"
              >
                <div>
                  <p className="text-ink font-medium">{asset.name}</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {asset.warranty_status === "expired" ? "Expired" : "Expires"}{" "}
                    {formatDate(asset.warranty_expiry_date)}
                  </p>
                </div>
                <StatusStamp status={asset.warranty_status} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-lg text-ink">Next Purchase</h2>
          <Link href="/planning" className="text-xs text-teal">
            View all →
          </Link>
        </div>

        {topPurchases.length === 0 ? (
          <div className="bg-teal-tint border border-teal/20 rounded-xl p-4 text-center text-teal-dark text-sm">
            Nothing on your wishlist right now.
          </div>
        ) : (
          <div className="space-y-2">
            {topPurchases.map((item) => (
              <Link
                key={item.id}
                href={`/planning/${item.id}/edit`}
                className="flex items-center justify-between bg-white border border-line rounded-xl p-3.5 hover:border-teal transition-colors"
              >
                <div>
                  <p className="text-ink font-medium">{item.name}</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {item.category}
                    {item.expected_vendor ? ` · ${item.expected_vendor}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-ink-soft">
                    {formatSAR(item.expected_price)}
                  </p>
                  {item.priority === "need_soon" && <StatusStamp status="due_soon" />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-lg text-ink">Next Maintenance Task</h2>
          <Link href="/maintenance" className="text-xs text-teal">
            View all →
          </Link>
        </div>

        {topMaintenance.length === 0 ? (
          <div className="bg-teal-tint border border-teal/20 rounded-xl p-4 text-center text-teal-dark text-sm">
            Nothing due right now. Nicely kept.
          </div>
        ) : (
          <div className="space-y-2">
            {topMaintenance.map((task) => (
              <Link
                key={task.id}
                href="/maintenance"
                className="flex items-center justify-between bg-white border border-line rounded-xl p-3.5 hover:border-teal transition-colors"
              >
                <div>
                  <p className="text-ink font-medium">{task.task_type}</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {task.asset_name ? `${task.asset_name} · ` : ""}
                    Due {formatDate(task.next_due_date)}
                  </p>
                </div>
                <StatusStamp status={task.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="flex gap-2">
        <Link
          href="/assets/new"
          className="flex-1 text-center bg-teal text-white rounded-lg py-2.5 font-medium hover:bg-teal-dark transition-colors"
        >
          + Add asset
        </Link>
        <Link
          href="/planning/new"
          className="flex-1 text-center border border-teal text-teal rounded-lg py-2.5 font-medium hover:bg-teal-tint transition-colors"
        >
          + Plan purchase
        </Link>
      </div>
    </div>
  );
}
