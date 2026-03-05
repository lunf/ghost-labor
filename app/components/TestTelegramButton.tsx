"use client";

import { useState } from "react";

type Status = "idle" | "success" | "error";

export function TestTelegramButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleTest() {
    const botTokenInput = document.getElementById("telegramBotToken") as HTMLInputElement | null;
    const chatIdInput = document.getElementById("telegramChatId") as HTMLInputElement | null;

    const botToken = botTokenInput?.value.trim() ?? "";
    const chatId = chatIdInput?.value.trim() ?? "";

    if (!botToken || !chatId) {
      setStatus("error");
      setMessage("Please provide Telegram bot token and chat ID first.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/settings/telegram/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ botToken, chatId })
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Telegram test failed.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Telegram test message sent.");
    } catch {
      setStatus("error");
      setMessage("Unable to reach Telegram API.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="slack-test-wrap">
      <button type="button" className="validate-btn" onClick={handleTest} disabled={pending}>
        {pending ? "Testing..." : "Test Telegram Connection"}
      </button>
      {status === "success" ? <p className="form-success">{message}</p> : null}
      {status === "error" ? <p className="form-error">{message}</p> : null}
    </div>
  );
}
