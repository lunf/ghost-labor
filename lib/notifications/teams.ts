export async function sendTeamsMessage(args: { webhookUrl: string; text: string }) {
  const { webhookUrl, text } = args;

  if (!webhookUrl) {
    return {
      ok: false,
      message: "Missing Teams webhook URL."
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Teams returned HTTP ${response.status}.`
      };
    }

    return {
      ok: true,
      message: "Teams message sent."
    };
  } catch {
    return {
      ok: false,
      message: "Could not send Teams message."
    };
  }
}

