import type { AssignmentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { evaluateSeat, toNumber } from "@/lib/reporting/detection";
import { dispatchCompletedAuditNotifications } from "@/lib/reporting/dispatch";
import type { WasteReason } from "@/types/report";

const ACTIVE_ASSIGNMENT: AssignmentStatus = "ACTIVE";

export async function runWasteAudit() {
  const runId = await createScheduledAuditRun();
  await executeScheduledAuditRun(runId);
  return runId;
}

export async function createScheduledAuditRun() {
  const run = await prisma.auditRun.create({
    data: {
      status: "SCHEDULED"
    }
  });

  return run.id;
}

export async function executeScheduledAuditRun(runId: string) {
  const now = new Date();
  const claimedRun = await prisma.auditRun.updateMany({
    where: { id: runId, status: "SCHEDULED" },
    data: {
      status: "IN PROGRESS",
      finishedAt: null,
      totalFindings: 0,
      estimatedMonthlySave: 0
    }
  });

  if (claimedRun.count === 0) {
    return runId;
  }

  try {
    const seats = await prisma.saaSSeat.findMany({
      where: {
        assignmentStatus: ACTIVE_ASSIGNMENT
      },
      include: {
        app: true,
        employee: true
      }
    });

    let totalFindings = 0;
    let estimatedMonthlySave = 0;

    const findingsData: Array<{
      auditRunId: string;
      appId: string;
      seatId: string;
      reason: WasteReason;
      inactivityDays: number | null;
      monthlySeatPrice: Prisma.Decimal;
      estimatedMonthlySave: Prisma.Decimal;
    }> = [];

    for (const seat of seats) {
      const result = evaluateSeat({
        now,
        inactivityDays: seat.app.inactivityDays,
        employeeStatus: seat.employee?.employmentStatus ?? null,
        lastLoginAt: seat.lastLoginAt
      });

      if (!result) {
        continue;
      }

      const monthly = seat.app.monthlySeatPrice;
      findingsData.push({
        auditRunId: runId,
        appId: seat.appId,
        seatId: seat.id,
        reason: result.reason,
        inactivityDays: result.inactivityDays,
        monthlySeatPrice: monthly,
        estimatedMonthlySave: monthly
      });

      totalFindings += 1;
      estimatedMonthlySave += toNumber(monthly);
    }

    if (findingsData.length > 0) {
      await prisma.wasteFinding.createMany({
        data: findingsData
      });
    }

    const completedRun = await prisma.auditRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        totalFindings,
        estimatedMonthlySave
      }
    });

    await dispatchCompletedAuditNotifications({
      runId: completedRun.id,
      status: completedRun.status,
      totalFindings: completedRun.totalFindings,
      estimatedMonthlySave: Number(completedRun.estimatedMonthlySave),
      finishedAt: completedRun.finishedAt
    });

    return runId;
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
}
