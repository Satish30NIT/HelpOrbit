"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BrandedLoader } from "@/components/ui/BrandedLoader";

export default function Home() {
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(token ? "/dashboard" : "/login");
  }, [loading, token, router]);

  return (
    <main className="app-bg flex min-h-screen items-center justify-center">
      <BrandedLoader size="lg" message="Loading HelpOrbit…" showMessage />
    </main>
  );
}
