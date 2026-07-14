"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ASSET_CATEGORIES, type AssetCategory, type PlanningPriority } from "@/types/database";
import { RoomSelect } from "@/components/RoomSelect";

export default function EditPlanningItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("Other");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [expectedVendor, setExpectedVendor] = useState("");
  const [priority, setPriority] = useState<PlanningPriority>("later");
  const [roomId, setRoomId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("planned");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("planning_items")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        setError("Could not load this item.");
        return;
      }

      setName(data.name ?? "");
      setCategory(data.category ?? "Other");
      setExpectedPrice(data.expected_price?.toString() ?? "");
      setExpectedVendor(data.expected_vendor ?? "");
      setPriority(data.priority ?? "later");
      setRoomId(data.room_id ?? "");
      setNotes(data.notes ?? "");
      setStatus(data.status ?? "planned");
      setLoaded(true);
    }
    load();
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase
      .from("planning_items")
      .update({
        name,
        category,
        expected_price: expectedPrice ? parseFloat(expectedPrice) : null,
        expected_vendor: expectedVendor || null,
        priority,
        room_id: roomId || null,
        notes: notes || null,
      })
      .eq("id", params.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/planning");
    router.refresh();
  }

  async function handleMarkPurchased() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("planning_items")
      .update({ status: "purchased", purchased_at: new Date().toISOString().slice(0, 10) })
      .eq("id", params.id);
    router.push("/planning");
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("planning_items").delete().eq("id", params.id);
    router.push("/planning");
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
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-8">
      <h1 className="font-serif text-xl text-ink">Edit planning item</h1>

      {status === "purchased" && (
        <div className="bg-teal-tint border border-teal/20 rounded-xl p-3 text-sm text-teal-dark">
          Marked as purchased. Remember to add the actual item under Assets if you haven&apos;t
          already.
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-line rounded-xl p-4 space-y-3">
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
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>

      {status === "planned" && (
        <button
          onClick={handleMarkPurchased}
          disabled={loading}
          className="w-full border border-teal text-teal rounded-lg py-2.5 font-medium hover:bg-teal-tint transition-colors disabled:opacity-60"
        >
          Mark as purchased
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={loading}
        className="w-full text-rust text-sm py-2 border border-rust/30 rounded-lg hover:bg-rust-tint transition-colors"
      >
        Delete item
      </button>

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
