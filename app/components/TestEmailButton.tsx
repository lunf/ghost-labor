"use client";

import { useState } from "react";

type Status = "idle" | "success" | "error";

export function TestEmailButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleTest() {
    const toInput = document.getElementById("reportToEmails") as HTMLInputElement | null;
    const hostInput = document.getElementById("smtpHost") as HTMLInputElement | null;
    const portInput = document.getElementById("smtpPort") as HTMLInputElement | null;
    const userInput = document.getElementById("smtpUser") as HTMLInputElement | null;
    const passInput = document.getElementById("smtpPass") as HTMLInputElement | null;
    const secureInput = document.getElementById("smtpSecure") as HTMLInputElement | null;
    const fromInput = document.getElementById("smtpFromEmail") as HTMLInputElement | null;
    const replyToInput = document.getElementById("smtpReplyTo") as HTMLInputElement | null;

    const payload = {
      to: toInput?.value.trim() ?? "",
      host: hostInput?.value.trim() ?? "",
      port: Number(portInput?.value || 587),
      user: userInput?.value.trim() ?? "",
      pass: passInput?.value ?? "",
      secure: secureInput?.checked ?? false,
      fromEmail: fromInput?.value.trim() ?? "",
      replyTo: replyToInput?.value.trim() ?? ""
    };

    if (!payload.to || !payload.host || !payload.user || !payload.pass || !payload.fromEmail) {
      setStatus("error");
      setMessage("Please provide recipient and SMTP fields before testing.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/settings/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(result.message ?? "Email test failed.");
        return;
      }

      setStatus("success");
      setMessage(result.message ?? "Test email sent successfully.");
    } catch {
      setStatus("error");
      setMessage("Unable to send test email.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="slack-test-wrap">
      <button type="button" className="validate-btn" onClick={handleTest} disabled={pending}>
        {pending ? "Testing..." : "Test Email Connection"}
      </button>
      {status === "success" ? <p className="form-success">{message}</p> : null}
      {status === "error" ? <p className="form-error">{message}</p> : null}
    </div>
  );
}
