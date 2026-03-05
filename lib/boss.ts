import PgBoss from "pg-boss";
import { env } from "@/lib/env";
import { createScheduledAuditRun, executeScheduledAuditRun } from "@/lib/report";
import { prisma } from "@/lib/db";

const QUEUE = {
  runAudit: "audit:run"
} as const;

declare global {
  // eslint-disable-next-line no-var
  var boss: PgBoss | undefined;
  // eslint-disable-next-line no-var
  var bossStarted: boolean | undefined;
}

function createBoss() {
  return new PgBoss({
    connectionString: env.DATABASE_URL
  });
}

export async function getBoss() {
  if (!globalThis.boss) {
    globalThis.boss = createBoss();
  }

  if (!globalThis.bossStarted) {
    await globalThis.boss.start();
    await globalThis.boss.createQueue(QUEUE.runAudit);

    globalThis.boss.work(QUEUE.runAudit, async (job) => {
      const runId = String(job.data?.runId ?? "");
      if (!runId) {
        throw new Error("Missing runId in queued audit job");
      }

      await executeScheduledAuditRun(runId);
    });

    globalThis.bossStarted = true;
  }

  return globalThis.boss;
}

export async function enqueueAuditRun() {
  const boss = await getBoss();
  const runId = await createScheduledAuditRun();

  let jobId: string | null = null;
  try {
    jobId = await boss.send(QUEUE.runAudit, { runId });
  } catch (error) {
    await prisma.auditRun.update({
      where: { id: runId },
      data: {
        status: "ERROR",
        finishedAt: new Date()
      }
    });

    throw error;
  }

  if (!jobId) {
    await prisma.auditRun.update({
      where: { id: runId },
      data: {
        status: "ERROR",
        finishedAt: new Date()
      }
    });

    throw new Error("Failed to enqueue audit run job");
  }

  return {
    runId,
    jobId
  };
}
