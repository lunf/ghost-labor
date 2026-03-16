import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { validateConnectorConnection } from "@/lib/connectors";

const payloadSchema = z.object({
  provider: z.string().min(1),
  apiBaseUrl: z.string().url(),
  apiToken: z.string().min(1)
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid connector payload."
      },
      { status: 400 }
    );
  }

  const result = await validateConnectorConnection(parsed.data);
  return NextResponse.json(result);
}
