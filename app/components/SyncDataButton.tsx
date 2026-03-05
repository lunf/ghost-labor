"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncDataButton() {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function syncData() {
    setPending(true);

    try {
      await fetch("/api/integrations/sync", {
        method: "POST"
      });
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={syncData} disabled={pending}>
      {pending ? "Syncing..." : "Sync HR + SaaS Data"}
    </button>
  );
}
