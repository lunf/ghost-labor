import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { sendEmailTest } from "@/lib/notifications/email";

const payloadSchema = z.object({
  to: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().min(1),
  user: z.string().min(1),
  pass: z.string().min(1),
  secure: z.boolean().default(false),
  fromEmail: z.string().email(),
  replyTo: z.string().optional().default("")
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid email payload." }, { status: 400 });
  }

  const result = await sendEmailTest({
    smtp: {
      host: parsed.data.host,
      port: parsed.data.port,
      secure: parsed.data.secure,
      user: parsed.data.user,
      pass: parsed.data.pass,
      fromEmail: parsed.data.fromEmail,
      replyTo: parsed.data.replyTo
    },
    to: parsed.data.to
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Email test sent successfully." });
}
