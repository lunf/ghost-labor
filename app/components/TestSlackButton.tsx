"use client";

import { useState } from "react";

type Status = "idle" | "success" | "error";

export function TestSlackButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleTest() {
    const webhookInput = document.getElementById("slackWebhookUrl") as HTMLInputElement | null;
    const channelInput = document.getElementById("slackChannel") as HTMLInputElement | null;

    const webhookUrl = webhookInput?.value.trim() ?? "";
    const channel = channelInput?.value.trim() ?? "";

    if (!webhookUrl) {
      setStatus("error");
      setMessage("Please provide Slack webhook URL first.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/settings/slack/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ webhookUrl, channel })
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Slack test failed.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Slack test message sent.");
    } catch {
      setStatus("error");
      setMessage("Unable to reach Slack webhook.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="slack-test-wrap">
      <button type="button" className="validate-btn" onClick={handleTest} disabled={pending}>
        {pending ? "Testing..." : "Test Slack Connection"}
      </button>
      {status === "success" ? <p className="form-success">{message}</p> : null}
      {status === "error" ? <p className="form-error">{message}</p> : null}
    </div>
  );
}
