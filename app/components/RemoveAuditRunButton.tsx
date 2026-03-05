"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveAuditRunButton({ runId }: { runId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function removeRun() {
    const confirmed = window.confirm("Remove this scheduled run?");
    if (!confirmed) {
      return;
    }

    setPending(true);
    try {
      await fetch(`/api/admin/run-audit/${runId}`, {
        method: "DELETE"
      });
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  return (
    <button type="button" className="danger-btn" disabled={pending} onClick={removeRun}>
      {pending ? "Removing..." : "Remove"}
    </button>
  );
}
