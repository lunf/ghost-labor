import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await prisma.auditRun.deleteMany({
    where: {
      id,
      status: "SCHEDULED"
    }
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { ok: false, message: "Run not found or not removable." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
