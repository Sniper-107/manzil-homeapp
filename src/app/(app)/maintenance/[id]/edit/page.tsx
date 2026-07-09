"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AssetOption {
  id: string;
  name: string;
}

export default function EditMaintenanceTaskPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [taskType, setTaskType] = useState("");
  const [assetId, setAssetId] = useState("");
  const [frequencyMonths, setFrequencyMonths] = useState("");
  const [lastDoneDate, setLastDoneDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: assetRows }, { data: task, error: taskError }] = await Promise.all([
        supabase.from("assets").select("id, name").order("name"),
        supabase.from("maintenance_tasks").select("*").eq("id", params.id).single(),
      ]);

      setAssets(assetRows ?? []);

      if (taskError || !task) {
        setError("Could not load this task.");
        return;
      }

      setTaskType(task.task_type ?? "");
      setAssetId(task.asset_id ?? "");
      setFrequencyMonths(task.frequency_months?.toString() ?? "");
      setLastDoneDate(task.last_done_date ?? "");
      setNotes(task.notes ?? "");
      setLoaded(true);
    }
    load();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_tasks")
      .update({
        task_type: taskType,
        asset_id: assetId || null,
        frequency_months: parseInt(frequencyMonths, 10),
        last_done_date: lastDoneDate || null,
        notes: notes || null,
      })
      .eq("id", params.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/maintenance");
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("maintenance_tasks").delete().eq("id", params.id);
    router.push("/maintenance");
    router.refresh();
  }

  if (!loaded) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        {error ? <p className="text-rust text-sm">{error}</p> : <p className="text-ink-soft text-sm">Loading...</p>}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-serif text-xl text-ink">Edit maintenance task</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-line rounded-xl p-4 space-y-3">
        <div>
          <label className="block text-xs text-ink-soft mb-1">Task</label>
          <input
            required
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-soft mb-1">Related asset (optional)</label>
          <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="input">
            <option value="">None — general house task</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-soft mb-1">Repeat every (months)</label>
            <input
              required
              type="number"
              min={1}
              value={frequencyMonths}
              onChange={(e) => setFrequencyMonths(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1">Last done</label>
            <input
              type="date"
              value={lastDoneDate}
              onChange={(e) => setLastDoneDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink-soft mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input" />
        </div>

        {error && <p className="text-rust text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal text-white rounded-lg py-2.5 font-medium hover:bg-teal-dark transition-colors disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="w-full text-rust text-sm py-2 border border-rust/30 rounded-lg hover:bg-rust-tint transition-colors"
        >
          Delete task
        </button>
      </form>

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
  );
}
