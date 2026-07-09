import Link from "next/link";
import { getCurrentUserAndHousehold } from "@/lib/household";
import { getUrgentWarranties, getUrgentMaintenance, getHouseholdStats } from "@/lib/queries";
import { StatusStamp } from "@/components/StatusStamp";

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSAR(amount: number) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage() {
  const { household } = await getCurrentUserAndHousehold();
  if (!household) return null;

  const [warranties, maintenance, stats] = await Promise.all([
    getUrgentWarranties(household.id),
    getUrgentMaintenance(household.id),
    getHouseholdStats(household.id),
  ]);

  const urgentCount = warranties.length + maintenance.length;

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

      <section>
        <h2 className="font-serif text-lg text-ink mb-3">
          Top Urgent Items {urgentCount > 0 && `(${urgentCount})`}
        </h2>

        {urgentCount === 0 ? (
          <div className="bg-teal-tint border border-teal/20 rounded-xl p-4 text-center text-teal-dark text-sm">
            Nothing urgent right now. Nicely kept.
          </div>
        ) : (
          <div className="space-y-2">
            {maintenance.map((task) => (
              <Link
                key={task.id}
                href={`/maintenance`}
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

            {warranties.map((asset) => (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="flex items-center justify-between bg-white border border-line rounded-xl p-3.5 hover:border-teal transition-colors"
              >
                <div>
                  <p className="text-ink font-medium">{asset.name}</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Warranty {task_or_warranty_word(asset.warranty_status)}{" "}
                    {formatDate(asset.warranty_expiry_date)}
                  </p>
                </div>
                <StatusStamp status={asset.warranty_status} />
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
          href="/maintenance/new"
          className="flex-1 text-center border border-teal text-teal rounded-lg py-2.5 font-medium hover:bg-teal-tint transition-colors"
        >
          + Log maintenance
        </Link>
      </div>
    </div>
  );
}

function task_or_warranty_word(status: string) {
  return status === "expired" ? "expired" : "expires";
}
