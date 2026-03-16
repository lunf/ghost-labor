import type { EmploymentStatus, Prisma } from "@prisma/client";
import type { WasteReason } from "@/types/reporting";

const INACTIVE_EMPLOYMENT: EmploymentStatus = "INACTIVE";

export function toNumber(decimal: Prisma.Decimal | number | string) {
  return Number(decimal);
}

function differenceInDays(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function evaluateSeat(args: {
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
