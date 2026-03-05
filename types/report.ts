export type WasteReason =
  | "employee_not_found"
  | "employee_inactive"
  | "inactive_for_threshold";

export interface FindingSummary {
  appName: string;
  count: number;
  monthlyWaste: number;
}

export interface LatestReportResponse {
  runId: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  totalFindings: number;
  estimatedMonthlySave: number;
  byApp: FindingSummary[];
}
