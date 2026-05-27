"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function UserActivityRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = new URLSearchParams(searchParams.toString());
    if (!q.has("category")) q.set("category", "user");
    router.replace(`/dashboard/activity?${q.toString()}`);
  }, [router, searchParams]);

  return null;
}
