"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AssetDocument, DocumentType } from "@/types/database";

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  warranty_card: "Warranty card",
  manual: "Manual",
  invoice: "Invoice",
  other: "Other",
};

export function DocumentsSection({
  assetId,
  householdId,
}: {
  assetId: string;
  householdId: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [docType, setDocType] = useState<DocumentType>("warranty_card");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function loadDocuments() {
    const supabase = createClient();
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false });
    setDocuments((data ?? []) as AssetDocument[]);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard async fetch-on-mount; setDocuments only runs after the await inside loadDocuments, not synchronously.
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const ext = file.name.split(".").pop() || "bin";
      const path = `${householdId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("documents").insert({
        household_id: householdId,
        asset_id: assetId,
        file_path: path,
        file_name: file.name,
        doc_type: docType,
        uploaded_by: user!.id,
      });
      if (insertError) throw insertError;

      await loadDocuments();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(doc: AssetDocument) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function handleDelete(doc: AssetDocument) {
    const supabase = createClient();
    await supabase.storage.from("documents").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    await loadDocuments();
  }

  return (
    <div className="bg-white border border-line rounded-xl p-4">
      <p className="text-xs text-ink-soft mb-2">Documents</p>

      {documents.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between text-sm bg-stone-dim rounded-lg px-3 py-2"
            >
              <button
                onClick={() => handleDownload(doc)}
                className="text-ink text-left truncate hover:text-teal transition-colors"
              >
                {doc.file_name}
                <span className="text-ink-soft text-xs ml-1.5">
                  ({DOC_TYPE_LABELS[doc.doc_type]})
                </span>
              </button>
              <button
                onClick={() => handleDelete(doc)}
                className="text-rust text-xs ml-2 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocumentType)}
          className="text-sm rounded-lg border border-line px-2 py-1.5"
        >
          {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelected}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1 text-sm border border-teal text-teal rounded-lg py-1.5 hover:bg-teal-tint transition-colors disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "+ Attach file"}
        </button>
      </div>
      {error && <p className="text-rust text-xs mt-2">{error}</p>}
    </div>
  );
}
