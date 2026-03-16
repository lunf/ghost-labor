import { getLatestReport, getLatestWastedSeats } from "@/lib/reporting/audit";

export async function getDashboardReport(provider?: string) {
  const report = await getLatestReport();

  if (!report) {
    return {
      report: null,
      wastedSeats: {
        runId: null,
        providers: [] as string[],
        rows: [] as Array<{
          name: string;
          email: string;
          saasProvider: string;
          lastUsedService: string;
        }>
      }
    };
  }

  const wastedSeats = await getLatestWastedSeats(provider);

  return {
    report,
    wastedSeats
  };
}

export async function getLatestReportOrNull() {
  return getLatestReport();
}

export async function getWastedSeatsReport(provider?: string) {
  return getLatestWastedSeats(provider);
}
