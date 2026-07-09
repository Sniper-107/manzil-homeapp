import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndHousehold } from "@/lib/household";
import type { MaintenanceDashboardRow, MaintenanceStatus } from "@/types/database";
import { StatusStamp } from "@/components/StatusStamp";
import { MarkDoneButton } from "./MarkDoneButton";

function formatDate(date: string | null) {
  if (!date) return "not scheduled";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const SECTION_ORDER: MaintenanceStatus[] = ["overdue", "due_soon", "upcoming", "not_scheduled"];
const SECTION_LABEL: Record<MaintenanceStatus, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  upcoming: "Upcoming",
  not_scheduled: "Not scheduled yet",
};

export default async function MaintenancePage() {
  const { household } = await getCurrentUserAndHousehold();
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
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl text-ink">Maintenance</h1>
        <Link
          href="/maintenance/new"
          className="bg-teal text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-dark transition-colors"
        >
          + Add task
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white border border-line rounded-xl p-8 text-center">
          <p className="text-ink-soft text-sm">
            No recurring maintenance tracked yet — things like AC servicing or water heater
            flushes.
          </p>
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.status}>
            <h2 className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
              {SECTION_LABEL[group.status]}
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
                      Every {task.frequency_months}mo · Next: {formatDate(task.next_due_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusStamp status={task.status} />
                    <Link
                      href={`/maintenance/${task.id}/edit`}
                      className="text-xs text-ink-soft border border-line rounded-lg px-2.5 py-1.5 hover:bg-stone-dim transition-colors"
                    >
                      Edit
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
