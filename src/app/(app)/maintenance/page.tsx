import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndHousehold, getUserLanguage } from "@/lib/household";
import type { MaintenanceDashboardRow, MaintenanceStatus } from "@/types/database";
import { StatusStamp } from "@/components/StatusStamp";
import { MarkDoneButton } from "./MarkDoneButton";
import { getTranslator } from "@/lib/i18n/getTranslator";
import type { StringKey } from "@/lib/i18n/strings";

function formatDate(date: string | null, locale: string, notScheduledLabel: string) {
  if (!date) return notScheduledLabel;
  return new Date(date).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const SECTION_ORDER: MaintenanceStatus[] = ["overdue", "due_soon", "upcoming", "not_scheduled"];
const SECTION_LABEL_KEY: Record<MaintenanceStatus, StringKey> = {
  overdue: "overdue",
  due_soon: "due_soon",
  upcoming: "upcoming",
  not_scheduled: "not_scheduled_yet",
};

export default async function MaintenancePage() {
  const { household } = await getCurrentUserAndHousehold();
  const language = await getUserLanguage();
  const t = getTranslator(language);
  const locale = language === "ar" ? "ar-SA" : "en-GB";
  if (!household) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("maintenance_dashboard")
    .select("*")
    .eq("household_id", household.id)
    .order("next_due_date", { ascending: true, nullsFirst: false });

  const tasks = (data ?? []) as MaintenanceDashboardRow[];
  const grouped = SECTION_ORDER.map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status === status),
  })).filter((g) => g.tasks.length > 0);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl text-ink">{t("maintenance_title")}</h1>
        <Link
          href="/maintenance/new"
          className="bg-teal text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-dark transition-colors"
        >
          {t("add_task")}
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white border border-line rounded-xl p-8 text-center">
          <p className="text-ink-soft text-sm">{t("no_maintenance_yet")}</p>
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.status}>
            <h2 className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
              {t(SECTION_LABEL_KEY[group.status])}
            </h2>
            <div className="space-y-2">
              {group.tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white border border-line rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-ink font-medium truncate">{task.task_type}</p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {task.asset_name ? `${task.asset_name} · ` : ""}
                      {t("every")} {task.frequency_months}mo · {t("next")}:{" "}
                      {formatDate(task.next_due_date, locale, t("not_scheduled_yet"))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusStamp status={task.status} language={language} />
                    <Link
                      href={`/maintenance/${task.id}/edit`}
                      className="text-xs text-ink-soft border border-line rounded-lg px-2.5 py-1.5 hover:bg-stone-dim transition-colors"
                    >
                      {t("edit")}
                    </Link>
                    <MarkDoneButton taskId={task.id} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
