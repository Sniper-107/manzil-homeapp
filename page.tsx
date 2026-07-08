const STYLES: Record<string, string> = {
  overdue: "border-rust text-rust",
  expired: "border-rust text-rust",
  due_soon: "border-amber text-amber",
  expiring_soon: "border-amber text-amber",
  upcoming: "border-teal text-teal",
  active: "border-teal text-teal",
  not_scheduled: "border-ink-soft text-ink-soft",
  no_warranty: "border-ink-soft text-ink-soft",
};

const LABELS: Record<string, string> = {
  overdue: "Overdue",
  expired: "Expired",
  due_soon: "Due soon",
  expiring_soon: "Expiring soon",
  upcoming: "Upcoming",
  active: "Active",
  not_scheduled: "Not scheduled",
  no_warranty: "No warranty",
};

export function StatusStamp({ status }: { status: string }) {
  const style = STYLES[status] ?? "border-ink-soft text-ink-soft";
  const label = LABELS[status] ?? status;

  return (
    <span
      className={`inline-block border-2 rounded px-2 py-0.5 text-[11px] font-serif font-bold tracking-wide uppercase -rotate-2 ${style}`}
    >
      {label}
    </span>
  );
}
