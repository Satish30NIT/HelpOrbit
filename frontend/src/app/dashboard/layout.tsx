"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { AppLoader } from "@/components/ui/AppLoader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  useEffect(() => {
    if (!loading && token) {
      const t = setTimeout(() => setShowLoader(false), 600);
      return () => clearTimeout(t);
    }
  }, [loading, token]);

  return (
    <>
      <AnimatePresence mode="wait">
        {(loading || (token && showLoader)) && <AppLoader key="loader" />}
      </AnimatePresence>
      {!loading && token && (
        <MainLayout>{children}</MainLayout>
      )}
    </>
  );
}
