"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ASSET_CATEGORIES, type AssetCategory, type PlanningPriority } from "@/types/database";
import { RoomSelect } from "@/components/RoomSelect";

export default function NewPlanningItemPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("Other");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [expectedVendor, setExpectedVendor] = useState("");
  const [priority, setPriority] = useState<PlanningPriority>("later");
  const [roomId, setRoomId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      const { error: insertError } = await supabase.from("planning_items").insert({
        household_id: membership.household_id,
        name,
        category,
        expected_price: expectedPrice ? parseFloat(expectedPrice) : null,
        expected_vendor: expectedVendor || null,
        priority,
        room_id: roomId || null,
        notes: notes || null,
        created_by: user!.id,
      });

      if (insertError) throw insertError;

      router.push("/planning");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-serif text-xl text-ink">Add to planning</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-line rounded-xl p-4 space-y-3">
        <div>
          <label className="block text-xs text-ink-soft mb-1">Item name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>

        <div>
          <label className="block text-xs text-ink-soft mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as AssetCategory)}
            className="input"
          >
            {ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-soft mb-1">Expected price (SAR)</label>
            <input
              type="number"
              step="0.01"
              value={expectedPrice}
              onChange={(e) => setExpectedPrice(e.target.value)}
              className="input font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1">Expected vendor</label>
            <input
              value={expectedVendor}
              onChange={(e) => setExpectedVendor(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink-soft mb-1">Priority</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPriority("need_soon")}
              className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${
                priority === "need_soon"
                  ? "bg-amber text-white border-amber"
                  : "border-line text-ink-soft"
              }`}
            >
              Need soon
            </button>
            <button
              type="button"
              onClick={() => setPriority("later")}
              className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${
                priority === "later" ? "bg-teal text-white border-teal" : "border-line text-ink-soft"
              }`}
            >
              Later
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink-soft mb-1">Room (optional)</label>
          <RoomSelect value={roomId} onChange={setRoomId} />
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
          {loading ? "Saving..." : "Add to planning"}
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
