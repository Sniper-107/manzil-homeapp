"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompress";
import { ASSET_CATEGORIES, type AssetCategory } from "@/types/database";
import { RoomSelect } from "@/components/RoomSelect";

type Stage = "idle" | "uploading" | "scanning" | "review" | "saving";

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

const EMPTY_FORM: FormState = {
  name: "",
  category: "Other",
  brand: "",
  model: "",
  vendor: "",
  purchase_date: "",
  price: "",
  warranty_months: "",
  room_id: "",
  notes: "",
};

export default function NewAssetPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setPreviewUrl(URL.createObjectURL(file));
    setStage("uploading");

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

      const compressed = await compressImage(file);
      const path = `${membership.household_id}/${crypto.randomUUID()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, compressed, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;
      setImagePath(path);

      setStage("scanning");
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Scan failed");
      }

      const result = json.result;
      setForm({
        name: result.name ?? "",
        category: ASSET_CATEGORIES.includes(result.category) ? result.category : "Other",
        brand: result.brand ?? "",
        model: result.model ?? "",
        vendor: result.store ?? "",
        purchase_date: result.buy ?? "",
        price: result.price?.toString() ?? "",
        warranty_months: result.warranty_months?.toString() ?? "",
        room_id: "",
        notes: "",
      });
      setAssumptions(result.assumptions ?? []);
      setQuestions(result.questions ?? []);
      setStage("review");
    } catch (err) {
      setError((err as Error).message);
      setStage("idle");
    }
  }

  function skipToManualEntry() {
    setStage("review");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStage("saving");
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

      let receiptId: string | null = null;
      if (imagePath) {
        const { data: receipt, error: receiptError } = await supabase
          .from("receipts")
          .insert({
            household_id: membership.household_id,
            image_path: imagePath,
            vendor: form.vendor || null,
            purchase_date: form.purchase_date || null,
            total_price: form.price ? parseFloat(form.price) : null,
            category: form.category,
            assumptions,
            questions,
            uploaded_by: user!.id,
          })
          .select("id")
          .single();
        if (receiptError) throw receiptError;
        receiptId = receipt.id;
      }

      const { data: asset, error: assetError } = await supabase
        .from("assets")
        .insert({
          household_id: membership.household_id,
          name: form.name || "Untitled item",
          category: form.category,
          brand: form.brand || null,
          model: form.model || null,
          vendor: form.vendor || null,
          purchase_date: form.purchase_date || null,
          price: form.price ? parseFloat(form.price) : null,
          warranty_months: form.warranty_months ? parseInt(form.warranty_months, 10) : null,
          room_id: form.room_id || null,
          receipt_id: receiptId,
          notes: form.notes || null,
          created_by: user!.id,
        })
        .select("id")
        .single();

      if (assetError) throw assetError;

      router.push(`/assets/${asset.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setStage("review");
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-8">
      <h1 className="font-serif text-xl text-ink">Add an asset</h1>

      {stage === "idle" && (
        <div className="bg-white border border-line rounded-xl p-6 text-center space-y-4">
          <p className="text-ink-soft text-sm">
            Take a photo of the receipt and we&apos;ll read the details automatically —
            works with Arabic and English receipts.
          </p>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelected}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full bg-teal text-white rounded-lg py-3 font-medium hover:bg-teal-dark transition-colors"
          >
            📷 Take a photo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border border-teal text-teal rounded-lg py-3 font-medium hover:bg-teal-tint transition-colors"
          >
            🖼️ Choose from files
          </button>
          <button
            onClick={skipToManualEntry}
            className="w-full text-ink-soft text-sm py-1"
          >
            Enter details manually instead
          </button>
          {error && <p className="text-rust text-sm">{error}</p>}
        </div>
      )}

      {(stage === "uploading" || stage === "scanning") && (
        <div className="bg-white border border-line rounded-xl p-6 text-center space-y-3">
          {previewUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={previewUrl} alt="Receipt preview" className="max-h-48 mx-auto rounded-lg" />
          )}
          <p className="text-ink-soft text-sm">
            {stage === "uploading" ? "Uploading photo..." : "Reading receipt with AI..."}
          </p>
        </div>
      )}

      {(stage === "review" || stage === "saving") && (
        <form onSubmit={handleSave} className="space-y-4">
          {previewUrl && (
            <div className="bg-white border border-line rounded-xl p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Receipt preview" className="max-h-40 mx-auto rounded-lg" />
            </div>
          )}

          {questions.length > 0 && (
            <div className="bg-amber-tint border border-amber/30 rounded-xl p-3.5">
              <p className="text-xs font-medium text-amber mb-1.5">Please double-check:</p>
              <ul className="text-sm text-ink-soft space-y-1 list-disc list-inside">
                {questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {assumptions.length > 0 && (
            <div className="bg-teal-tint border border-teal/20 rounded-xl p-3.5">
              <p className="text-xs font-medium text-teal-dark mb-1.5">AI assumed:</p>
              <ul className="text-sm text-ink-soft space-y-1 list-disc list-inside">
                {assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white border border-line rounded-xl p-4 space-y-3">
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
          </div>

          {error && <p className="text-rust text-sm">{error}</p>}

          <button
            type="submit"
            disabled={stage === "saving"}
            className="w-full bg-teal text-white rounded-lg py-3 font-medium hover:bg-teal-dark transition-colors disabled:opacity-60"
          >
            {stage === "saving" ? "Saving..." : "Save asset"}
          </button>
        </form>
      )}

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
