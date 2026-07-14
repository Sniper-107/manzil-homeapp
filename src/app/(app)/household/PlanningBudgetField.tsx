"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PlanningBudgetField({
  householdId,
  initialValue,
}: {
  householdId: string;
  initialValue: number | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase
      .from("households")
      .update({ planning_budget: value ? parseFloat(value) : null })
      .eq("id", householdId);
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex gap-2">
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. 10000"
        className="flex-1 rounded-lg border border-line px-3 py-2 text-ink font-mono focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-teal text-white rounded-lg px-4 text-sm font-medium hover:bg-teal-dark transition-colors disabled:opacity-60"
      >
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
