// Types matching supabase/migrations/0001_init.sql.
// Once the real Supabase project is running, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
// and this hand-written version can be deleted.

export type AssetCategory =
  | "Devices"
  | "Furniture"
  | "AC & HVAC"
  | "Plumbing"
  | "Electrical"
  | "Ceramic & Tiles"
  | "Gypsum"
  | "Doors & Windows"
  | "Paint"
  | "Car"
  | "Other";

export const ASSET_CATEGORIES: AssetCategory[] = [
  "Devices",
  "Furniture",
  "AC & HVAC",
  "Plumbing",
  "Electrical",
  "Ceramic & Tiles",
  "Gypsum",
  "Doors & Windows",
  "Paint",
  "Car",
  "Other",
];

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  planning_budget: number | null;
  created_by: string;
  created_at: string;
}

export interface Room {
  id: string;
  household_id: string;
  name: string;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
}

export interface Receipt {
  id: string;
  household_id: string;
  image_path: string;
  raw_ai_response: Record<string, unknown> | null;
  vendor: string | null;
  purchase_date: string | null;
  total_price: number | null;
  category: string | null;
  ocr_language_detected: string | null;
  assumptions: string[];
  questions: string[];
  uploaded_by: string;
  created_at: string;
}

export interface Asset {
  id: string;
  household_id: string;
  name: string;
  category: AssetCategory;
  brand: string | null;
  model: string | null;
  vendor: string | null;
  purchase_date: string | null;
  price: number | null;
  warranty_months: number | null;
  warranty_expiry_date: string | null;
  receipt_id: string | null;
  room_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type WarrantyStatus = "no_warranty" | "expired" | "expiring_soon" | "active";

export interface WarrantyDashboardRow extends Asset {
  warranty_status: WarrantyStatus;
}

export interface MaintenanceTask {
  id: string;
  household_id: string;
  asset_id: string | null;
  room_id: string | null;
  task_type: string;
  frequency_months: number;
  last_done_date: string | null;
  next_due_date: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export type PlanningPriority = "need_soon" | "later";
export type PlanningStatus = "planned" | "purchased" | "cancelled";

export interface PlanningItem {
  id: string;
  household_id: string;
  name: string;
  category: AssetCategory | null;
  expected_price: number | null;
  expected_vendor: string | null;
  priority: PlanningPriority;
  status: PlanningStatus;
  notes: string | null;
  room_id: string | null;
  created_by: string;
  created_at: string;
  purchased_at: string | null;
}

export type DocumentType = "warranty_card" | "manual" | "invoice" | "other";

export interface AssetDocument {
  id: string;
  household_id: string;
  asset_id: string | null;
  file_path: string;
  file_name: string;
  doc_type: DocumentType;
  uploaded_by: string;
  created_at: string;
}

export type MaintenanceStatus = "not_scheduled" | "overdue" | "due_soon" | "upcoming";

export interface MaintenanceDashboardRow extends MaintenanceTask {
  asset_name: string | null;
  status: MaintenanceStatus;
}

export interface MaintenanceLog {
  id: string;
  maintenance_task_id: string;
  done_date: string;
  cost: number | null;
  notes: string | null;
  done_by: string;
  created_at: string;
}

// Shape returned by the receipt-scan Edge Function
export interface ReceiptScanResult {
  name: string | null;
  category: AssetCategory | null;
  brand: string | null;
  model: string | null;
  buy: string | null; // purchase date, YYYY-MM-DD
  price: number | null;
  rcpt: string | null; // receipt/invoice number
  store: string | null;
  war: string | null; // warranty duration as stated
  warranty_months: number | null; // parsed from `war`; DB derives the actual expiry date from this
  language_detected: "ar" | "en" | "mixed" | null;
  assumptions: string[];
  questions: string[];
}
