export type WasteReason =
  | "employee_not_found"
  | "employee_inactive"
  | "inactive_for_threshold";

export type FindingSummary = {
  appName: string;
  count: number;
  monthlyWaste: number;
};

export type LatestReportResponse = {
  runId: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  totalFindings: number;
  estimatedMonthlySave: number;
  byApp: FindingSummary[];
};

export type WastedSeatRow = {
  name: string;
  email: string;
  saasProvider: string;
  lastUsedService: string;
};
