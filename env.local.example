"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setLoading(false);
        setError(error.message);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        setError(error.message);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-ink">Manzil</h1>
          <p className="text-ink-soft text-sm mt-1">Home asset & maintenance ledger</p>
        </div>

        <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 text-sm py-1.5 rounded-lg transition-colors ${
                mode === "signin" ? "bg-teal text-white" : "text-ink-soft"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 text-sm py-1.5 rounded-lg transition-colors ${
                mode === "signup" ? "bg-teal text-white" : "text-ink-soft"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-ink-soft mb-1.5">
                Username (email format)
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@manzil.app"
                className="w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-ink-soft mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
              />
            </div>

            {error && <p className="text-rust text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal text-white rounded-lg py-2.5 font-medium hover:bg-teal-dark transition-colors disabled:opacity-60"
            >
              {loading
                ? mode === "signup"
                  ? "Creating account..."
                  : "Signing in..."
                : mode === "signup"
                ? "Create account"
                : "Sign in"}
            </button>
          </form>
        </div>

        {mode === "signup" && (
          <p className="text-center text-xs text-ink-soft mt-6">
            After creating your account, sign in right away — no email confirmation needed
            once your Supabase project has it disabled (see setup notes).
          </p>
        )}
      </div>
    </main>
  );
}
