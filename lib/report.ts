import type { AssignmentStatus, EmploymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { WasteReason } from "@/types/report";
import { sendEmailMessage } from "@/lib/notifications/email";
import { sendSlackMessage } from "@/lib/notifications/slack";
import { sendTeamsMessage } from "@/lib/notifications/teams";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { renderReportMessage } from "@/lib/report-template";

const ACTIVE_ASSIGNMENT: AssignmentStatus = "ACTIVE";
const INACTIVE_EMPLOYMENT: EmploymentStatus = "INACTIVE";

function toNumber(decimal: Prisma.Decimal | number | string) {
  return Number(decimal);
}

function differenceInDays(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function evaluateSeat(args: {
  now: Date;
  inactivityDays: number;
  employeeStatus: EmploymentStatus | null;
  lastLoginAt: Date | null;
}): { reason: WasteReason; inactivityDays: number | null } | null {
  const { now, inactivityDays, employeeStatus, lastLoginAt } = args;

  if (!employeeStatus) {
    return { reason: "employee_not_found", inactivityDays: null };
  }

  if (employeeStatus === INACTIVE_EMPLOYMENT) {
    return { reason: "employee_inactive", inactivityDays: null };
  }

  if (!lastLoginAt) {
    return { reason: "inactive_for_threshold", inactivityDays: null };
  }

  const idleDays = differenceInDays(lastLoginAt, now);
  if (idleDays >= inactivityDays) {
    return { reason: "inactive_for_threshold", inactivityDays: idleDays };
  }

  return null;
}

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

    const settings = await prisma.appSetting.findUnique({
      where: { id: "default" }
    });

    const amount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(Number(completedRun.estimatedMonthlySave));
    const finishedAtLabel = completedRun.finishedAt
      ? formatDateTime(completedRun.finishedAt)
      : formatDateTime(new Date());
    const messageText = renderReportMessage(settings?.reportMessageTemplate, {
      runId: completedRun.id,
      status: completedRun.status,
      findings: completedRun.totalFindings,
      savings: amount,
      finishedAt: finishedAtLabel
    });

    if (
      settings?.reportEmail &&
      settings.reportToEmails &&
      settings.smtpHost &&
      settings.smtpUser &&
      settings.smtpPass &&
      settings.smtpFromEmail
    ) {
      const subject = "Ghost Labor report is ready";

      await sendEmailMessage({
        smtp: {
          host: settings.smtpHost,
          port: settings.smtpPort,
          secure: settings.smtpSecure,
          user: settings.smtpUser,
          pass: settings.smtpPass,
          fromEmail: settings.smtpFromEmail,
          replyTo: settings.smtpReplyTo || undefined
        },
        to: settings.reportToEmails,
        subject,
        text: messageText
      });
    }

    if (settings?.reportSlack && settings.slackWebhookUrl) {
      await sendSlackMessage({
        webhookUrl: settings.slackWebhookUrl,
        channel: settings.slackChannel || undefined,
        text: messageText
      });
    }

    if (settings?.reportTeams && settings.teamsWebhookUrl) {
      await sendTeamsMessage({
        webhookUrl: settings.teamsWebhookUrl,
        text: messageText
      });
    }

    if (settings?.reportTelegram && settings.telegramBotToken && settings.telegramChatId) {
      await sendTelegramMessage({
        botToken: settings.telegramBotToken,
        chatId: settings.telegramChatId,
        text: messageText
      });
    }

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

export async function getLatestReport() {
  const run = await prisma.auditRun.findFirst({
    orderBy: {
      startedAt: "desc"
    }
  });

  if (!run) {
    return null;
  }

  const grouped = await prisma.wasteFinding.groupBy({
    by: ["appId"],
    where: {
      auditRunId: run.id
    },
    _count: {
      _all: true
    },
    _sum: {
      estimatedMonthlySave: true
    }
  });

  const appIds = grouped.map((item) => item.appId);
  const apps = appIds.length
    ? await prisma.saaSApp.findMany({
        where: { id: { in: appIds } }
      })
    : [];

  const appById = new Map(apps.map((app) => [app.id, app.name]));

  return {
    runId: run.id,
    status: run.status,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt ? run.finishedAt.toISOString() : null,
    totalFindings: run.totalFindings,
    estimatedMonthlySave: toNumber(run.estimatedMonthlySave),
    byApp: grouped
      .map((item) => ({
        appName: appById.get(item.appId) ?? "Unknown",
        count: item._count._all,
        monthlyWaste: toNumber(item._sum.estimatedMonthlySave ?? 0)
      }))
      .sort((a, b) => b.monthlyWaste - a.monthlyWaste)
  };
}

export type WastedSeatRow = {
  name: string;
  email: string;
  saasProvider: string;
  lastUsedService: string;
};

export async function getLatestWastedSeats(provider?: string) {
  const run = await prisma.auditRun.findFirst({
    orderBy: {
      startedAt: "desc"
    }
  });

  if (!run) {
    return {
      runId: null,
      providers: [] as string[],
      rows: [] as WastedSeatRow[]
    };
  }

  const findings = await prisma.wasteFinding.findMany({
    where: {
      auditRunId: run.id
    },
    select: {
      seatId: true
    }
  });

  const seatIds = Array.from(new Set(findings.map((item) => item.seatId)));
  if (seatIds.length === 0) {
    return {
      runId: run.id,
      providers: [] as string[],
      rows: [] as WastedSeatRow[]
    };
  }

  const seats = await prisma.saaSSeat.findMany({
    where: {
      id: {
        in: seatIds
      }
    },
    include: {
      app: true,
      employee: true
    }
  });

  const rowsAll: WastedSeatRow[] = seats.map((seat) => ({
    name: seat.employee?.fullName ?? seat.assigneeEmail,
    email: seat.assigneeEmail,
    saasProvider: seat.app.provider,
    lastUsedService: seat.lastLoginAt ? seat.lastLoginAt.toISOString() : "Never"
  }));

  const providers = Array.from(new Set(rowsAll.map((item) => item.saasProvider))).sort((a, b) =>
    a.localeCompare(b)
  );

  const rows =
    provider && provider.trim().length > 0
      ? rowsAll.filter((item) => item.saasProvider === provider)
      : rowsAll;

  return {
    runId: run.id,
    providers,
    rows
  };
}
