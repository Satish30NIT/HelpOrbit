"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ApiError } from "@/lib/api";
import { Logo } from "@/components/brand/Logo";
import { BrandedLoader } from "@/components/ui/BrandedLoader";

export default function LoginPage() {
  const router = useRouter();
  const { login, token, loading: hydrating } = useAuth();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrating && token) router.replace("/dashboard");
  }, [hydrating, token, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      toast("Signed in successfully. Welcome back!", "success");
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Sign in failed. Please check your credentials and try again.";
      setError(message);
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (hydrating) {
    return (
      <main className="app-bg flex min-h-screen items-center justify-center">
        <BrandedLoader size="lg" message="Loading HelpOrbit…" showMessage />
      </main>
    );
  }

  return (
    <main className="app-bg flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to your HelpOrbit admin workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email or Username
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-16"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700"
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || hydrating}
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <BrandedLoader size="xs" ring={false} />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">
          HelpOrbit · Policy & User Management
        </p>
      </motion.div>
    </main>
  );
}
