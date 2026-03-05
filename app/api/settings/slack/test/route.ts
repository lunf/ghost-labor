import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { sendSlackMessage } from "@/lib/notifications/slack";

const payloadSchema = z.object({
  webhookUrl: z.string().url(),
  channel: z.string().optional().default("")
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid Slack payload." }, { status: 400 });
  }

  const result = await sendSlackMessage({
    webhookUrl: parsed.data.webhookUrl,
    channel: parsed.data.channel,
    text: "Ghost Labor Slack integration test: connection is working."
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Slack test message sent successfully." });
}
