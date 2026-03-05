export async function sendTelegramMessage(args: {
  botToken: string;
  chatId: string;
  text: string;
}) {
  const { botToken, chatId, text } = args;

  if (!botToken || !chatId) {
    return {
      ok: false,
      message: "Missing Telegram bot token or chat ID."
    };
  }

  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Telegram returned HTTP ${response.status}.`
      };
    }

    const payload = (await response.json()) as { ok?: boolean; description?: string };

    if (!payload.ok) {
      return {
        ok: false,
        message: payload.description ?? "Telegram API rejected the message."
      };
    }

    return {
      ok: true,
      message: "Telegram message sent."
    };
  } catch {
    return {
      ok: false,
      message: "Could not send Telegram message."
    };
  }
}

