import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { enqueueAuditRun } from "@/lib/jobs/queue";

export async function POST() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const queued = await enqueueAuditRun();

  return NextResponse.json(
    {
      ok: true,
      jobId: queued.jobId,
      runId: queued.runId
    },
    { status: 202 }
  );
}
