"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteAssetButton({ assetId }: { assetId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("assets").delete().eq("id", assetId);
    router.push("/assets");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full text-rust text-sm py-2 border border-rust/30 rounded-lg hover:bg-rust-tint transition-colors"
      >
        Delete asset
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="flex-1 bg-rust text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60"
      >
        {loading ? "Deleting..." : "Confirm delete"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="flex-1 border border-line rounded-lg py-2 text-sm text-ink-soft"
      >
        Cancel
      </button>
    </div>
  );
}
