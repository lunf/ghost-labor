"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RunAuditButton() {
  return <RunAuditButtonWithLabel />;
}

export function RunAuditButtonWithLabel({
  idleLabel = "Run Waste Audit",
  pendingLabel = "Queueing audit..."
}: {
  idleLabel?: string;
  pendingLabel?: string;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function runAudit() {
    setPending(true);

    try {
      await fetch("/api/admin/run-audit", {
        method: "POST"
      });
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={runAudit} disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
