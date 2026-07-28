import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export function AuthForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error(result.error.message);
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="w-full">
      <h1 className="text-xl font-semibold tracking-[-0.02em]">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "signin" ? "Sign in to your DevMatrix workspace" : "Start routing smarter today"}
      </p>

      <button
        onClick={handleGoogle}
        disabled={loading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.28 6.61l3.99 3.09C6.21 6.86 8.87 4.75 12 4.75z"/><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58l3.86 2.99c2.26-2.09 3.56-5.17 3.56-8.81z"/><path fill="#FBBC05" d="M5.27 14.29a7.24 7.24 0 0 1 0-4.58L1.28 6.61A11.98 11.98 0 0 0 0 12c0 1.94.47 3.77 1.28 5.39l3.99-3.1z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.86-2.99c-1.07.72-2.45 1.16-4.07 1.16-3.13 0-5.79-2.11-6.73-4.95l-3.99 3.09C3.25 21.31 7.31 24 12 24z"/></svg>
        Continue with Google
      </button>

      <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-input bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--primary)]"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-input bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--primary)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[color:var(--primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-[var(--shadow-soft)] hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground"
      >
        {mode === "signin" ? "No account? Create one" : "Have an account? Sign in"}
      </button>
    </div>
  );
}
