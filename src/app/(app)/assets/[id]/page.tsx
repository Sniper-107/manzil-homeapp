import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndHousehold, getUserLanguage } from "@/lib/household";
import type { Asset, Receipt } from "@/types/database";
import { DeleteAssetButton } from "./DeleteAssetButton";
import { DocumentsSection } from "@/components/DocumentsSection";
import { getTranslator } from "@/lib/i18n/getTranslator";
import { CATEGORY_LABELS_AR } from "@/lib/i18n/strings";

function formatDate(date: string | null, locale: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSAR(amount: number | null) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { household } = await getCurrentUserAndHousehold();
  const language = await getUserLanguage();
  const t = getTranslator(language);
  const locale = language === "ar" ? "ar-SA" : "en-GB";
  if (!household) return null;

  const supabase = await createClient();
  const { data: asset } = await supabase
    .from("assets")
    .select("*")
    .eq("id", id)
    .single();

  if (!asset) notFound();

  const typedAsset = asset as Asset;
  const categoryLabel =
    language === "ar" ? CATEGORY_LABELS_AR[typedAsset.category] ?? typedAsset.category : typedAsset.category;

  let receiptPhotoUrl: string | null = null;
  let receipt: Receipt | null = null;
  if (typedAsset.receipt_id) {
    const { data: receiptRow } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", typedAsset.receipt_id)
      .single();
    receipt = receiptRow as Receipt | null;

    if (receipt) {
      const { data: signed } = await supabase.storage
        .from("receipts")
        .createSignedUrl(receipt.image_path, 60 * 10);
      receiptPhotoUrl = signed?.signedUrl ?? null;
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-8" dir={language === "ar" ? "rtl" : "ltr"}>
      <Link href="/assets" className="text-teal text-sm">
        {t("back_to_assets")}
      </Link>

      <div className="bg-white border border-line rounded-xl p-5">
        <h1 className="font-serif text-2xl text-ink">{typedAsset.name}</h1>
        <p className="text-ink-soft text-sm mt-1">{categoryLabel}</p>

        <dl className="mt-5 space-y-3 text-sm">
          <Row label={t("brand_model")} value={[typedAsset.brand, typedAsset.model].filter(Boolean).join(" / ") || "—"} />
          <Row label={t("vendor")} value={typedAsset.vendor ?? "—"} />
          <Row label={t("purchase_date")} value={formatDate(typedAsset.purchase_date, locale)} />
          <Row label={t("price")} value={formatSAR(typedAsset.price)} mono />
          <Row
            label={t("warranty")}
            value={
              typedAsset.warranty_expiry_date
                ? `${typedAsset.warranty_months} ${t("months")} — ${t("expires")} ${formatDate(typedAsset.warranty_expiry_date, locale)}`
                : t("no_warranty_on_file")
            }
          />
          {typedAsset.notes && <Row label={t("notes")} value={typedAsset.notes} />}
        </dl>
      </div>

      {receiptPhotoUrl && (
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft mb-2">{t("receipt_photo")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={receiptPhotoUrl} alt="Receipt" className="rounded-lg w-full" />
        </div>
      )}

      <DocumentsSection assetId={typedAsset.id} householdId={household.id} />

      <div className="flex gap-2">
        <Link
          href={`/assets/${typedAsset.id}/edit`}
          className="flex-1 text-center border border-teal text-teal text-sm py-2 rounded-lg hover:bg-teal-tint transition-colors"
        >
          {t("edit")}
        </Link>
        <div className="flex-1">
          <DeleteAssetButton assetId={typedAsset.id} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={`text-ink text-right ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
