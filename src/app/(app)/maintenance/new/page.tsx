"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RoomSelect } from "@/components/RoomSelect";

interface AssetOption {
  id: string;
  name: string;
}

const COMMON_TASKS = [
  "AC servicing",
  "Water heater flush",
  "Air filter change",
  "Water filter change",
  "Fire extinguisher check",
  "Pest control",
];

export default function NewMaintenanceTaskPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [taskType, setTaskType] = useState("");
  const [assetId, setAssetId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [frequencyMonths, setFrequencyMonths] = useState("6");
  const [lastDoneDate, setLastDoneDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAssets() {
      const supabase = createClient();
      const { data } = await supabase.from("assets").select("id, name").order("name");
      setAssets(data ?? []);
    }
    loadAssets();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      if (!membership) throw new Error("No household found");

      const { error: insertError } = await supabase.from("maintenance_tasks").insert({
        household_id: membership.household_id,
        asset_id: assetId || null,
        room_id: roomId || null,
        task_type: taskType,
        frequency_months: parseInt(frequencyMonths, 10),
        last_done_date: lastDoneDate || null,
        notes: notes || null,
        created_by: user!.id,
      });

      if (insertError) throw insertError;

      router.push("/maintenance");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-serif text-xl text-ink">Add maintenance task</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-line rounded-xl p-4 space-y-3">
        <div>
          <label className="block text-xs text-ink-soft mb-1">Task</label>
          <input
            required
            list="common-tasks"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            placeholder="e.g. AC servicing"
            className="input"
          />
          <datalist id="common-tasks">
            {COMMON_TASKS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
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

        <div>
          <label className="block text-xs text-ink-soft mb-1">Room (optional)</label>
          <RoomSelect value={roomId} onChange={setRoomId} />
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
            <label className="block text-xs text-ink-soft mb-1">Last done (optional)</label>
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
          {loading ? "Saving..." : "Save task"}
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
