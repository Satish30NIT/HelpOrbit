"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy route — opens view drawer on the policies list. */
export default function PolicyDetailRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) router.replace(`/dashboard/policies?view=${id}`);
    else router.replace("/dashboard/policies");
  }, [id, router]);

  return null;
}
