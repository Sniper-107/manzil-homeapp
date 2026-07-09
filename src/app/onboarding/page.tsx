"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkExistingHousehold() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membership) {
        router.replace("/dashboard");
        return;
      }
      setCheckingExisting(false);
    }
    checkExistingHousehold();
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.rpc("create_household", {
      household_name: name,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.rpc("join_household_by_code", {
      code: code.trim(),
    });
    setLoading(false);
    if (error) {
      setError("That invite code didn't match a household. Double-check it and try again.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {checkingExisting ? (
          <p className="text-center text-ink-soft text-sm">Loading...</p>
        ) : (
          <>
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-ink">Set up your household</h1>
          <p className="text-ink-soft text-sm mt-1">
            One household is shared by everyone tracking the same apartment.
          </p>
        </div>

        <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
          {mode === "choose" && (
            <div className="space-y-3">
              <button
                onClick={() => setMode("create")}
                className="w-full bg-teal text-white rounded-lg py-2.5 font-medium hover:bg-teal-dark transition-colors"
              >
                Create a new household
              </button>
              <button
                onClick={() => setMode("join")}
                className="w-full border border-teal text-teal rounded-lg py-2.5 font-medium hover:bg-teal-tint transition-colors"
              >
                Join with an invite code
              </button>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm text-ink-soft mb-1.5">
                  Household name
                </label>
                <input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Our Jeddah Apartment"
                  className="w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                />
              </div>
              {error && <p className="text-rust text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal text-white rounded-lg py-2.5 font-medium hover:bg-teal-dark transition-colors disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create household"}
              </button>
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="w-full text-ink-soft text-sm py-1"
              >
                Back
              </button>
            </form>
          )}

          {mode === "join" && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm text-ink-soft mb-1.5">
                  Invite code
                </label>
                <input
                  id="code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 8e3b3488"
                  className="w-full rounded-lg border border-line px-3 py-2 text-ink font-mono focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                />
                <p className="text-xs text-ink-soft mt-1.5">
                  Ask whoever set up the household for their invite code (Household settings → Invite code).
                </p>
              </div>
              {error && <p className="text-rust text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal text-white rounded-lg py-2.5 font-medium hover:bg-teal-dark transition-colors disabled:opacity-60"
              >
                {loading ? "Joining..." : "Join household"}
              </button>
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="w-full text-ink-soft text-sm py-1"
              >
                Back
              </button>
            </form>
          )}
        </div>
          </>
        )}
      </div>
    </main>
  );
}
