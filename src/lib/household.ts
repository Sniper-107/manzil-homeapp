import { createClient } from "@/lib/supabase/server";
import type { Household } from "@/types/database";

export async function getCurrentUserAndHousehold() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, household: null };

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role, households(id, name, invite_code, planning_budget, created_by, created_at)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const household = (membership?.households as unknown as Household) ?? null;

  return { user, household, role: membership?.role as "owner" | "member" | undefined };
}
