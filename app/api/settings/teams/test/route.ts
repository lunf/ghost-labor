import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { sendTeamsMessage } from "@/lib/notifications/teams";

const payloadSchema = z.object({
  webhookUrl: z.string().url()
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid Teams payload." }, { status: 400 });
  }

  const result = await sendTeamsMessage({
    webhookUrl: parsed.data.webhookUrl,
    text: "Ghost Labor Teams integration test: connection is working."
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Teams test message sent successfully." });
}
