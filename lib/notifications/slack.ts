export async function sendSlackMessage(args: {
  webhookUrl: string;
  text: string;
  channel?: string;
}) {
  const { webhookUrl, text, channel } = args;

  if (!webhookUrl) {
    return {
      ok: false,
      message: "Missing Slack webhook URL."
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        ...(channel ? { channel } : {})
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Slack returned HTTP ${response.status}.`
      };
    }

    return {
      ok: true,
      message: "Slack message sent."
    };
  } catch {
    return {
      ok: false,
      message: "Could not send Slack message."
    };
  }
}

