"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ASSET_CATEGORIES, type AssetCategory, type PlanningPriority } from "@/types/database";

interface Row {
  id: string;
  name: string;
  category: AssetCategory;
  expected_price: string;
  expected_vendor: string;
  priority: PlanningPriority;
}

function emptyRow(): Row {
  return {
    id: crypto.randomUUID(),
    name: "",
    category: "Other",
    expected_price: "",
    expected_vendor: "",
    priority: "later",
  };
}

export default function BulkPlanningPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSaveAll() {
    setError("");
    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length === 0) {
      setError("Add at least one item with a name.");
      return;
    }

    setLoading(true);
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

      const { error: insertError } = await supabase.from("planning_items").insert(
        validRows.map((r) => ({
          household_id: membership.household_id,
          name: r.name.trim(),
          category: r.category,
          expected_price: r.expected_price ? parseFloat(r.expected_price) : null,
          expected_vendor: r.expected_vendor || null,
          priority: r.priority,
          created_by: user!.id,
        })),
      );

      if (insertError) throw insertError;

      router.push("/planning");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4 pb-8">
      <h1 className="font-serif text-xl text-ink">Bulk add to planning</h1>
      <p className="text-xs text-ink-soft -mt-2">
        Add several items at once. Blank rows are ignored automatically.
      </p>

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={row.id} className="bg-white border border-line rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-soft">Item {i + 1}</p>
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(row.id)}
                  className="text-rust text-xs"
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>

            <input
              value={row.name}
              onChange={(e) => updateRow(row.id, { name: e.target.value })}
              placeholder="Item name"
              className="input"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={row.category}
                onChange={(e) => updateRow(row.id, { category: e.target.value as AssetCategory })}
                className="input text-sm"
              >
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                value={row.expected_price}
                onChange={(e) => updateRow(row.id, { expected_price: e.target.value })}
                placeholder="Price (SAR)"
                className="input text-sm font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                value={row.expected_vendor}
                onChange={(e) => updateRow(row.id, { expected_vendor: e.target.value })}
                placeholder="Expected vendor"
                className="input text-sm"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => updateRow(row.id, { priority: "need_soon" })}
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                    row.priority === "need_soon"
                      ? "bg-amber text-white border-amber"
                      : "border-line text-ink-soft"
                  }`}
                >
                  Need soon
                </button>
                <button
                  type="button"
                  onClick={() => updateRow(row.id, { priority: "later" })}
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                    row.priority === "later" ? "bg-teal text-white border-teal" : "border-line text-ink-soft"
                  }`}
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        type="button"
        className="w-full border border-teal text-teal rounded-lg py-2 text-sm font-medium hover:bg-teal-tint transition-colors"
      >
        + Add another row
      </button>

      {error && <p className="text-rust text-sm">{error}</p>}

      <button
        onClick={handleSaveAll}
        disabled={loading}
        className="w-full bg-teal text-white rounded-lg py-2.5 font-medium hover:bg-teal-dark transition-colors disabled:opacity-60"
      >
        {loading ? "Saving..." : `Save all (${rows.filter((r) => r.name.trim()).length})`}
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
