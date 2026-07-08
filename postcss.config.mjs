import { createClient } from "@/lib/supabase/server";
import type { WarrantyDashboardRow, MaintenanceDashboardRow } from "@/types/database";

export async function getUrgentWarranties(householdId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("warranty_dashboard")
    .select("*")
    .eq("household_id", householdId)
    .in("warranty_status", ["expired", "expiring_soon"])
    .order("warranty_expiry_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WarrantyDashboardRow[];
}

export async function getUrgentMaintenance(householdId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_dashboard")
    .select("*")
    .eq("household_id", householdId)
    .in("status", ["overdue", "due_soon"])
    .order("next_due_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MaintenanceDashboardRow[];
}

export async function getHouseholdStats(householdId: string) {
  const supabase = await createClient();
  const { count: assetCount } = await supabase
    .from("assets")
    .select("*", { count: "exact", head: true })
    .eq("household_id", householdId);

  const { count: expiredCount } = await supabase
    .from("warranty_dashboard")
    .select("*", { count: "exact", head: true })
    .eq("household_id", householdId)
    .eq("warranty_status", "expired");

  const { data: priceRows } = await supabase
    .from("assets")
    .select("price")
    .eq("household_id", householdId);

  const totalValue = (priceRows ?? []).reduce(
    (sum, row) => sum + (row.price ?? 0),
    0,
  );

  return { assetCount: assetCount ?? 0, expiredCount: expiredCount ?? 0, totalValue };
}
