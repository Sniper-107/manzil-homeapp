"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function MarkDoneButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const today = new Date().toISOString().slice(0, 10);

    await supabase.from("maintenance_log").insert({
      maintenance_task_id: taskId,
      done_date: today,
      cost: cost ? parseFloat(cost) : null,
      notes: notes || null,
      done_by: user!.id,
    });
    await supabase
      .from("maintenance_tasks")
      .update({ last_done_date: today })
      .eq("id", taskId);

    setLoading(false);
    setOpen(false);
    setCost("");
    setNotes("");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs border border-teal text-teal rounded-lg px-2.5 py-1.5 hover:bg-teal-tint transition-colors whitespace-nowrap"
      >
        {t("mark_done")}
      </button>

      {open && (
        <div className="fixed inset-0 bg-ink/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4">
            <h3 className="font-serif text-lg text-ink">{t("mark_as_done")}</h3>
            <p className="text-xs text-ink-soft -mt-2">{t("add_what_you_did")}</p>

            <div>
              <label className="block text-xs text-ink-soft mb-1">{t("cost_optional")}</label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="input"
                placeholder="e.g. 150"
              />
            </div>

            <div>
              <label className="block text-xs text-ink-soft mb-1">{t("notes_optional")}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="input"
                placeholder="e.g. Replaced filter, technician from ABC Company"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-teal text-white rounded-lg py-2 text-sm font-medium hover:bg-teal-dark transition-colors disabled:opacity-60"
              >
                {loading ? t("saving") : t("confirm_done")}
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 border border-line rounded-lg py-2 text-sm text-ink-soft"
              >
                {t("cancel")}
              </button>
            </div>
          </div>

          <style jsx global>{`
            .input {
              width: 100%;
              border: 1px solid var(--color-line);
              border-radius: 0.5rem;
              padding: 0.5rem 0.75rem;
              color: var(--color-ink);
            }
            .input:focus {
              outline: none;
              border-color: var(--color-teal);
              box-shadow: 0 0 0 2px var(--color-teal-tint);
            }
          `}</style>
        </div>
      )}
    </>
  );
}
