"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function MarkDoneButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleMarkDone() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const today = new Date().toISOString().slice(0, 10);

    // Log it, then update the task's last_done_date (which recalculates
    // next_due_date via the generated column).
    await supabase.from("maintenance_log").insert({
      maintenance_task_id: taskId,
      done_date: today,
      done_by: user!.id,
    });
    await supabase
      .from("maintenance_tasks")
      .update({ last_done_date: today })
      .eq("id", taskId);

    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleMarkDone}
      disabled={loading}
      className="text-xs border border-teal text-teal rounded-lg px-2.5 py-1.5 hover:bg-teal-tint transition-colors disabled:opacity-60 whitespace-nowrap"
    >
      {loading ? "..." : "Mark done"}
    </button>
  );
}
