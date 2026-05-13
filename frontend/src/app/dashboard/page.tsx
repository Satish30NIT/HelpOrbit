"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { displayName } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  if (loading || !token || !user) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const name = displayName(user);
  const initials =
    name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow shadow-indigo-500/30">
              H
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">HelpOrbit</p>
              <p className="text-xs text-slate-500">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              aria-hidden
            >
              {initials}
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white shadow-lg shadow-indigo-500/20 sm:p-8">
          <p className="text-sm uppercase tracking-wider text-indigo-100/80">
            Welcome back
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{name} 👋</h1>
          <p className="mt-2 max-w-xl text-sm text-indigo-100">
            You&apos;re signed in to HelpOrbit. Use the modules below to manage
            users, policies, and view analytics.
          </p>
          {user.role_name && (
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-inset ring-white/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Role: {user.role_name}
            </span>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard
            title="User Management"
            description="Create, edit and assign roles to users."
            status="Coming in Step 4"
          />
          <ModuleCard
            title="Policy Management"
            description="Create policies, assign to users, track acknowledgements."
            status="Coming in Step 5"
          />
          <ModuleCard
            title="Analytics"
            description="Acknowledgement rates, active users, activity trends."
            status="Coming in Step 6"
          />
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-500">
            Your account (debug)
          </h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs leading-relaxed dark:bg-slate-950/60">
{JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </section>
    </main>
  );
}

function ModuleCard({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="group rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700">
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Soon
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {description}
      </p>
      <p className="mt-3 text-xs text-slate-400">{status}</p>
    </div>
  );
}
