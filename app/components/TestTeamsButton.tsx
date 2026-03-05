"use client";

import { useState } from "react";

type Status = "idle" | "success" | "error";

export function TestTeamsButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleTest() {
    const webhookInput = document.getElementById("teamsWebhookUrl") as HTMLInputElement | null;
    const webhookUrl = webhookInput?.value.trim() ?? "";

    if (!webhookUrl) {
      setStatus("error");
      setMessage("Please provide Teams webhook URL first.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/settings/teams/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ webhookUrl })
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Teams test failed.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Teams test message sent.");
    } catch {
      setStatus("error");
      setMessage("Unable to reach Teams webhook.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="teams-test-wrap">
      <button type="button" className="validate-btn" onClick={handleTest} disabled={pending}>
        {pending ? "Testing..." : "Test Teams Connection"}
      </button>
      {status === "success" ? <p className="form-success">{message}</p> : null}
      {status === "error" ? <p className="form-error">{message}</p> : null}
    </div>
  );
}

