"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(token ? "/dashboard" : "/login");
  }, [loading, token, router]);

  return (
    <main className="flex flex-1 items-center justify-center">
      <p className="text-sm text-slate-500">Loading…</p>
    </main>
  );
}
