import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndHousehold } from "@/lib/household";
import { SignOutButton } from "./SignOutButton";

export default async function HouseholdSettingsPage() {
  const { household, user } = await getCurrentUserAndHousehold();
  if (!household) return null;

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("household_members")
    .select("id, role, user_id")
    .eq("household_id", household.id);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-serif text-xl text-ink">Household settings</h1>

      <div className="bg-white border border-line rounded-xl p-4">
        <p className="text-xs text-ink-soft mb-1">Household name</p>
        <p className="text-ink font-medium">{household.name}</p>
      </div>

      <div className="bg-white border border-line rounded-xl p-4">
        <p className="text-xs text-ink-soft mb-1">Invite code</p>
        <p className="font-mono text-lg text-teal-dark tracking-wide">{household.invite_code}</p>
        <p className="text-xs text-ink-soft mt-2">
          Share this code so someone else can join your household — they&apos;ll enter it
          during sign-up.
        </p>
      </div>

      <div className="bg-white border border-line rounded-xl p-4">
        <p className="text-xs text-ink-soft mb-2">Members ({members?.length ?? 0})</p>
        <div className="space-y-1.5 text-sm">
          {members?.map((m) => (
            <div key={m.id} className="flex justify-between">
              <span className="text-ink">{m.user_id === user?.id ? "You" : "Household member"}</span>
              <span className="text-ink-soft capitalize">{m.role}</span>
            </div>
          ))}
        </div>
      </div>

      <SignOutButton />
    </div>
  );
}
