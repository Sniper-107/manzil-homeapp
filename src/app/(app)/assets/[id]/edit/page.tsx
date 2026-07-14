"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ASSET_CATEGORIES, type AssetCategory } from "@/types/database";
import { RoomSelect } from "@/components/RoomSelect";

interface FormState {
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  vendor: string;
  purchase_date: string;
  price: string;
  warranty_months: string;
  room_id: string;
  notes: string;
}

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        setError("Could not load this asset.");
        return;
      }

      setForm({
        name: data.name ?? "",
        category: data.category ?? "Other",
        brand: data.brand ?? "",
        model: data.model ?? "",
        vendor: data.vendor ?? "",
        purchase_date: data.purchase_date ?? "",
        price: data.price?.toString() ?? "",
        warranty_months: data.warranty_months?.toString() ?? "",
        room_id: data.room_id ?? "",
        notes: data.notes ?? "",
      });
    }
    load();
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase
      .from("assets")
      .update({
        name: form.name,
        category: form.category,
        brand: form.brand || null,
        model: form.model || null,
        vendor: form.vendor || null,
        purchase_date: form.purchase_date || null,
        price: form.price ? parseFloat(form.price) : null,
        warranty_months: form.warranty_months ? parseInt(form.warranty_months, 10) : null,
        room_id: form.room_id || null,
        notes: form.notes || null,
      })
      .eq("id", params.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/assets/${params.id}`);
    router.refresh();
  }

  if (!form) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        {error ? <p className="text-rust text-sm">{error}</p> : <p className="text-ink-soft text-sm">Loading...</p>}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-8">
      <h1 className="font-serif text-xl text-ink">Edit asset</h1>

      <form onSubmit={handleSave} className="bg-white border border-line rounded-xl p-4 space-y-3">
        <Field label="Item name">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
          />
        </Field>

        <Field label="Category">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as AssetCategory })}
            className="input"
          >
            {ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand">
            <input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Model">
            <input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="input"
            />
          </Field>
        </div>

        <Field label="Vendor / store">
          <input
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Purchase date">
            <input
              type="date"
              value={form.purchase_date}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Price (SAR)">
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="input font-mono"
            />
          </Field>
        </div>

        <Field label="Warranty (months)">
          <input
            type="number"
            value={form.warranty_months}
            onChange={(e) => setForm({ ...form, warranty_months: e.target.value })}
            className="input"
          />
        </Field>

        <Field label="Room">
          <RoomSelect
            value={form.room_id}
            onChange={(roomId) => setForm({ ...form, room_id: roomId })}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input"
            rows={2}
          />
        </Field>

        {error && <p className="text-rust text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal text-white rounded-lg py-2.5 font-medium hover:bg-teal-dark transition-colors disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save changes"}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-ink-soft mb-1">{label}</label>
      {children}
    </div>
  );
}
