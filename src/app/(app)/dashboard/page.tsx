import Link from "next/link";
import { getCurrentUserAndHousehold, getUserLanguage } from "@/lib/household";
import {
  getUrgentWarranties,
  getUrgentMaintenance,
  getHouseholdStats,
  getNextPurchases,
} from "@/lib/queries";
import { StatusStamp } from "@/components/StatusStamp";
import { getTranslator } from "@/lib/i18n/getTranslator";

function formatDate(date: string | null, locale: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(locale, {
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
  const language = await getUserLanguage();
  const t = getTranslator(language);
  const locale = language === "ar" ? "ar-SA" : "en-GB";
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
    <div className="p-4 space-y-6 max-w-2xl mx-auto" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-2xl font-serif text-ink">{stats.assetCount}</p>
          <p className="text-xs text-ink-soft mt-0.5">{t("assets_tracked")}</p>
        </div>
        <div className="bg-white border border-line rounded-xl p-4">
          <p className={`text-2xl font-serif font-mono ${stats.expiredCount > 0 ? "text-rust" : "text-ink"}`}>
            {stats.expiredCount}
          </p>
          <p className="text-xs text-ink-soft mt-0.5">{t("warranty_expired")}</p>
        </div>
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-lg font-serif text-ink font-mono">
            {formatSAR(stats.totalValue)}
          </p>
          <p className="text-xs text-ink-soft mt-0.5">{t("total_value")}</p>
        </div>
      </div>

      {warranties.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
            {t("warranty_expiring_soon")}
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
                    {asset.warranty_status === "expired" ? t("expired") : t("expires")}{" "}
                    {formatDate(asset.warranty_expiry_date, locale)}
                  </p>
                </div>
                <StatusStamp status={asset.warranty_status} language={language} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-lg text-ink">{t("next_purchase")}</h2>
          <Link href="/planning" className="text-xs text-teal">
            {t("view_all")} →
          </Link>
        </div>

        {topPurchases.length === 0 ? (
          <div className="bg-teal-tint border border-teal/20 rounded-xl p-4 text-center text-teal-dark text-sm">
            {t("nothing_on_wishlist")}
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
                  {item.priority === "need_soon" && (
                    <StatusStamp status="due_soon" language={language} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-lg text-ink">{t("next_maintenance_task")}</h2>
          <Link href="/maintenance" className="text-xs text-teal">
            {t("view_all")} →
          </Link>
        </div>

        {topMaintenance.length === 0 ? (
          <div className="bg-teal-tint border border-teal/20 rounded-xl p-4 text-center text-teal-dark text-sm">
            {t("nothing_due")}
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
                    {t("next")} {formatDate(task.next_due_date, locale)}
                  </p>
                </div>
                <StatusStamp status={task.status} language={language} />
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
          {t("add_asset")}
        </Link>
        <Link
          href="/planning/new"
          className="flex-1 text-center border border-teal text-teal rounded-lg py-2.5 font-medium hover:bg-teal-tint transition-colors"
        >
          {t("plan_purchase")}
        </Link>
      </div>
    </div>
  );
}
