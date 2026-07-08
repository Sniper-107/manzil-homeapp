import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReceiptScanResult } from "@/types/database";

const SYSTEM_PROMPT = `You read photos of retail/purchase receipts for a home-asset tracking app used in Saudi Arabia. Receipts may be in Arabic, English, or a mix of both.

Extract the fields below and respond with ONLY a single JSON object — no markdown fences, no commentary.

{
  "name": string | null,        // short human name for the main item bought, e.g. "Samsung 55\" TV". If multiple line items, pick the single highest-value item, or a short summary like "Kitchen appliances (4 items)" if items are similar value.
  "category": one of ["Devices","Furniture","AC & HVAC","Plumbing","Electrical","Ceramic & Tiles","Gypsum","Doors & Windows","Paint","Car","Other"] | null,
  "brand": string | null,
  "model": string | null,
  "buy": string | null,         // purchase date as YYYY-MM-DD
  "price": number | null,       // total amount paid, numeric only
  "rcpt": string | null,        // receipt/invoice number if visible
  "store": string | null,       // vendor/store name
  "war": string | null,         // warranty duration AS STATED on the receipt if visible (e.g. "2 years"), else null
  "language_detected": "ar" | "en" | "mixed" | null,
  "assumptions": string[],      // short notes on anything you inferred rather than read directly (e.g. "Assumed category Devices based on item name")
  "questions": string[]         // short questions for the user about anything ambiguous or illegible
}

Rules:
- If the receipt is illegible or not actually a receipt, set fields to null and explain in "questions".
- Never invent a price, date, or warranty duration that isn't visibly supported — if uncertain, use null and add a question instead.
- Arabic numerals and Arabic month names should be converted to a normal YYYY-MM-DD date.
- Respond with ONLY the JSON object.`;

export async function POST(request: Request) {
  const { path } = (await request.json()) as { path?: string };
  if (!path) {
    return NextResponse.json({ error: "Missing image path" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Downloading via the user's own session means this call is
  // automatically scoped by the storage RLS policies — a user can
  // only ever fetch images from their own household's folder.
  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("receipts")
    .download(path);

  if (downloadError || !fileBlob) {
    return NextResponse.json(
      { error: `Could not read uploaded image: ${downloadError?.message ?? "unknown error"}` },
      { status: 404 },
    );
  }

  const arrayBuffer = await fileBlob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: ANTHROPIC_API_KEY is not set" },
      { status: 500 },
    );
  }

  let anthropicResponse: Response;
  try {
    anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64,
                },
              },
              {
                type: "text",
                text: "Extract the receipt fields as instructed.",
              },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not reach Claude API: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  if (!anthropicResponse.ok) {
    const text = await anthropicResponse.text();
    return NextResponse.json(
      { error: `Claude API error (${anthropicResponse.status}): ${text}` },
      { status: 502 },
    );
  }

  const data = await anthropicResponse.json();
  const textBlock = (data.content ?? []).find(
    (block: { type: string }) => block.type === "text",
  );

  if (!textBlock) {
    return NextResponse.json({ error: "No text response from Claude" }, { status: 502 });
  }

  let parsed: ReceiptScanResult;
  try {
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: "Could not parse Claude's response as JSON", raw: textBlock.text },
      { status: 502 },
    );
  }

  // Parse a stated warranty duration ("2 years", "6 months", Arabic
  // equivalents) into a month count. The DB's generated column then
  // derives the actual expiry date from purchase_date + this number —
  // we don't compute the expiry date twice in two places.
  parsed.warranty_months = parseWarrantyMonths(parsed.war);

  return NextResponse.json({ result: parsed, raw: data });
}

function parseWarrantyMonths(warrantyText: string | null): number | null {
  if (!warrantyText) return null;

  const monthsMatch = warrantyText.match(/(\d+)\s*(?:month|شهر)/i);
  const yearsMatch = warrantyText.match(/(\d+)\s*(?:year|سنة|سنو)/i);

  let months = 0;
  if (yearsMatch) months += parseInt(yearsMatch[1], 10) * 12;
  if (monthsMatch) months += parseInt(monthsMatch[1], 10);
  return months > 0 ? months : null;
}
