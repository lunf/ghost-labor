import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

const payloadSchema = z.object({
  botToken: z.string().min(1),
  chatId: z.string().min(1)
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid Telegram payload." }, { status: 400 });
  }

  const result = await sendTelegramMessage({
    botToken: parsed.data.botToken,
    chatId: parsed.data.chatId,
    text: "Ghost Labor Telegram integration test: connection is working."
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Telegram test message sent successfully." });
}
