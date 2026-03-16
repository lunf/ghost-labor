import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/reporting/detection";
import type { LatestReportResponse, WastedSeatRow } from "@/types/reporting";

export async function getLatestReport(): Promise<LatestReportResponse | null> {
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
